/**
 * 下载页领域模块：镜像清单、访客侧测速、Release 资产匹配与展示格式化。
 *
 * 镜像来源分三层：
 *  1. 种子节点（GitHub 官方 + Akams 加速）；
 *  2. 内置清单 src/data/mirrors.json —— 由每日定时任务从聚合站爬取刷新；
 *  3. 运行时发现 —— 访客浏览器经公共 CORS 代理抓取聚合站，24h 会话缓存。
 */
import mirrorHosts from './mirrors.json';

export const GITHUB_OWNER = 'LX-M-Music';
export const GITHUB_REPO = 'lx-m_lx-Miao-moe-music-desktop';
export const RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

/** 访客侧对单个镜像的一次测速结果 */
export type ProbeState = 'pending' | 'done' | 'error';

export interface SpeedResult {
  id: string;
  /** 往返延迟 ms；null 表示连接失败 */
  latency: number | null;
  state: ProbeState;
}

export interface MirrorConfig {
  id: string;
  name: string;
  kind: 'official' | 'proxy';
  /** 测速探测地址（no-cors HEAD，仅衡量连通性） */
  testUrl: string;
  /** 把 GitHub 文件直链转换为该镜像的下载直链 */
  buildDownloadUrl: (githubUrl: string) => string;
}

const HOST_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

const OFFICIAL: MirrorConfig = {
  id: 'github',
  name: 'GitHub 官方',
  kind: 'official',
  testUrl: 'https://github.com/',
  buildDownloadUrl: githubUrl => githubUrl,
};

// github.akams.cn 采用 ?url= 查询参数透传原始 GitHub 链接
const AKAMS: MirrorConfig = {
  id: 'github.akams.cn',
  name: 'Akams 加速',
  kind: 'proxy',
  testUrl: 'https://github.akams.cn/',
  buildDownloadUrl: githubUrl =>
    `https://github.akams.cn/?url=${encodeURIComponent(githubUrl)}`,
};

function hostMirror(host: string): MirrorConfig {
  return {
    id: host,
    name: host,
    kind: 'proxy',
    testUrl: `https://${host}/`,
    buildDownloadUrl: githubUrl => `https://${host}/${githubUrl}`,
  };
}

/** 内置镜像清单（种子 + 每日定时任务刷新的加速节点） */
export function loadMirrors(): MirrorConfig[] {
  const proxies = mirrorHosts
    .filter(host => host !== 'github.akams.cn')
    .map(hostMirror);
  return [OFFICIAL, AKAMS, ...proxies];
}

/** 把运行时发现的新主机并入镜像列表（去重、不覆盖内置项） */
export function mergeDiscoveredMirrors(
  current: MirrorConfig[],
  hosts: string[],
): MirrorConfig[] {
  const known = new Set(current.map(m => m.id));
  const fresh = hosts
    .filter(host => HOST_RE.test(host) && !known.has(host))
    .map(hostMirror);
  return fresh.length > 0 ? [...current, ...fresh] : current;
}

// ---------------------------------------------------------------------------
// 运行时镜像发现（浏览器端，经公共 CORS 代理）
// ---------------------------------------------------------------------------

const RUNTIME_CACHE_KEY = 'lxm-runtime-mirrors-v1';
const RUNTIME_CACHE_TTL = 24 * 60 * 60 * 1000;

const CORS_PROXIES: Array<(url: string) => string> = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchViaProxy(url: string, timeoutMs: number): Promise<string> {
  let lastError: unknown = null;
  for (const wrap of CORS_PROXIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(wrap(url), {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (res.ok) return await res.text();
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error('所有代理均不可用');
}

function extractMoretoolsHosts(html: string): string[] {
  const hosts = new Set<string>();
  const spanRe =
    /<span class="min-w-0 break-all font-mono text-sm text-foreground">(https?:\/\/[^<]+?)<\/span>/g;
  let m: RegExpExecArray | null;
  while ((m = spanRe.exec(html)) !== null) {
    try {
      hosts.add(new URL(m[1]).hostname.toLowerCase());
    } catch {
      // 跳过无法解析的条目
    }
  }
  if (hosts.size === 0) {
    // 页面结构变化时的宽松兜底
    const genericRe = /https?:\/\/([a-z0-9][a-z0-9.-]*\.[a-z]{2,})\/(?=["'<\s]|$)/gi;
    while ((m = genericRe.exec(html)) !== null) {
      if (!/moretools|googleads|googletagmanager/.test(m[1])) {
        hosts.add(m[1].toLowerCase());
      }
    }
  }
  return [...hosts];
}

function extractAkamsHosts(js: string): string[] {
  const hosts: string[] = [];
  const re = /value:"([a-z0-9.-]+\.[a-z]{2,})"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(js)) !== null) hosts.push(m[1].toLowerCase());
  return hosts;
}

async function discoverRuntimeHosts(): Promise<string[]> {
  const hosts = new Set<string>();

  // moretools.app：SSR HTML 内嵌完整加速前缀列表
  try {
    const html = await fetchViaProxy(
      'https://www.moretools.app/zh-CN/github-proxy',
      10000,
    );
    for (const host of extractMoretoolsHosts(html)) hosts.add(host);
  } catch {
    // 忽略，内置清单兜底
  }

  // github.akams.cn：节点列表编译在 Next.js chunk 里
  try {
    const home = await fetchViaProxy('https://github.akams.cn/', 10000);
    const chunks = [
      ...new Set(
        [...home.matchAll(/\/_next\/static\/chunks\/[a-z0-9]+\.js/g)].map(
          x => x[0],
        ),
      ),
    ].slice(0, 12);
    const results = await Promise.allSettled(
      chunks.map(chunk =>
        fetchViaProxy(`https://github.akams.cn${chunk}`, 15000),
      ),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const host of extractAkamsHosts(result.value)) hosts.add(host);
      }
    }
  } catch {
    // 忽略
  }

  return [...hosts];
}

function readRuntimeCache(): string[] | null {
  try {
    const raw = window.sessionStorage.getItem(RUNTIME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {ts: number; hosts: string[]};
    if (Date.now() - parsed.ts > RUNTIME_CACHE_TTL) return null;
    return Array.isArray(parsed.hosts) ? parsed.hosts : null;
  } catch {
    return null;
  }
}

function writeRuntimeCache(hosts: string[]): void {
  try {
    window.sessionStorage.setItem(
      RUNTIME_CACHE_KEY,
      JSON.stringify({ts: Date.now(), hosts}),
    );
  } catch {
    // 隐私模式等场景下不可用，静默降级
  }
}

/**
 * 运行时发现镜像节点。优先读 24 小时会话缓存；失败返回空数组（内置清单兜底）。
 */
export async function discoverRuntimeMirrors(): Promise<string[]> {
  const cached = readRuntimeCache();
  if (cached) return cached;
  const hosts = await discoverRuntimeHosts();
  if (hosts.length > 0) writeRuntimeCache(hosts);
  return hosts;
}

export function releaseFileUrl(tag: string, filename: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${tag}/${encodeURIComponent(filename)}`;
}

export function buildDownloadUrl(
  mirror: MirrorConfig,
  tag: string,
  filename: string,
): string {
  return mirror.buildDownloadUrl(releaseFileUrl(tag, filename));
}

/** 对单个镜像发起一次探测，返回延迟 ms；失败返回 null */
export async function probeMirror(
  mirror: MirrorConfig,
  timeoutMs: number,
): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    await fetch(mirror.testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
    return Math.round(performance.now() - startedAt);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 并发探测镜像列表，每完成一个立即回调，供页面流式刷新 */
export async function probeAllMirrors(
  mirrors: MirrorConfig[],
  options: {
    concurrency?: number;
    timeoutMs?: number;
    onResult?: (id: string, latency: number | null) => void;
  } = {},
): Promise<void> {
  const {concurrency = 8, timeoutMs = 5000, onResult} = options;
  let next = 0;
  const workers = Array.from(
    {length: Math.min(concurrency, mirrors.length)},
    async () => {
      while (next < mirrors.length) {
        const mirror = mirrors[next++];
        const latency = await probeMirror(mirror, timeoutMs);
        onResult?.(mirror.id, latency);
      }
    },
  );
  await Promise.all(workers);
}

/** 测速完成后取延迟最低的可用镜像 id；全部失败返回 null */
export function bestMirrorId(results: SpeedResult[]): string | null {
  let best: SpeedResult | null = null;
  for (const result of results) {
    if (result.state !== 'done' || result.latency === null) continue;
    if (!best || (best.latency ?? Infinity) > result.latency) best = result;
  }
  return best?.id ?? null;
}

export function latencyGrade(latency: number): string {
  if (latency < 500) return '极快';
  if (latency < 1500) return '很快';
  if (latency < 3000) return '一般';
  return '较慢';
}

// ---------------------------------------------------------------------------
// Release 资产
// ---------------------------------------------------------------------------

export interface ReleaseAsset {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  digest?: string;
}

export interface ReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    {headers: {Accept: 'application/vnd.github+json'}},
  );
  if (!res.ok) {
    throw new Error(
      res.status === 403
        ? 'GitHub API 请求次数已达上限，请稍后重试'
        : `GitHub API 返回 HTTP ${res.status}`,
    );
  }
  return (await res.json()) as ReleaseInfo;
}

export interface PlatformConfig {
  id: string;
  name: string;
  description: string;
  /** 平台专属图标（Windows 为应用原始 ICO） */
  iconSrc: string;
  /** 命中任一规则的安装包归入该平台 */
  patterns: RegExp[];
}

/** 自动更新增量包 / 校验文件等非安装产物 */
const NON_INSTALLER_RE = /(?:-update\.(?:bin|json)|\.blockmap)$/i;

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'windows',
    name: 'Windows',
    description: 'Windows 10 / 11 · x64 / x86 / ARM64',
    iconSrc: '/img/app-icon.ico',
    patterns: [
      /-win_(?:x64|x86|arm64)-(?:Setup\.exe|green\.7z)$/i,
      /-(?:x64|x86|x86_64|arm64)-(?:Setup\.exe|portable\.exe)$/i,
    ],
  },
  {
    id: 'win7',
    name: 'Windows 7 兼容版',
    description: 'Windows 7 / 8 / 8.1（x64 / x86，独立构建）',
    iconSrc: '/img/app-icon.ico',
    patterns: [/-win7_(?:x64|x86)-(?:Setup\.exe|green\.7z)$/i],
  },
  {
    id: 'macos',
    name: 'macOS',
    description: 'macOS 10.15+ · Intel / Apple Silicon',
    iconSrc: '/img/app-icon-256.png',
    patterns: [/\.dmg$/i],
  },
  {
    id: 'linux',
    name: 'Linux',
    description: 'deb / rpm / AppImage / pacman',
    iconSrc: '/img/app-icon-256.png',
    patterns: [/\.(?:deb|rpm|AppImage|pacman)$/i],
  },
];

function assetSortKey(name: string): number {
  if (/Setup\.exe$/i.test(name)) return 0;
  if (/portable\.exe$/i.test(name)) return 1;
  if (/green\.7z$/i.test(name)) return 2;
  return 3;
}

export function assetsForPlatform(
  release: ReleaseInfo,
  platform: PlatformConfig,
): ReleaseAsset[] {
  return release.assets
    .filter(
      asset =>
        !NON_INSTALLER_RE.test(asset.name) &&
        platform.patterns.some(pattern => pattern.test(asset.name)),
    )
    .sort(
      (a, b) =>
        assetSortKey(a.name) - assetSortKey(b.name) ||
        a.name.localeCompare(b.name),
    );
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${units[i]}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface GuideItem {
  label: string;
  description: string;
}

export interface GuideSection {
  title: string;
  iconSrc: string;
  note?: string;
  items: GuideItem[];
}

export const INSTALL_GUIDE: GuideSection[] = [
  {
    title: 'Windows',
    iconSrc: '/img/app-icon.ico',
    items: [
      {label: 'Setup.exe', description: '标准安装版，支持自动更新'},
      {label: 'portable.exe', description: '便携版，单文件免安装'},
      {label: 'green.7z', description: '绿色版，解压即用'},
      {label: 'x64 / x86 / arm64', description: '64 位、32 位与 ARM 架构'},
      {label: 'win7_ 前缀', description: 'Windows 7/8/8.1 兼容版（基于 Electron 22）'},
    ],
  },
  {
    title: 'macOS',
    iconSrc: '/img/app-icon-256.png',
    note: '当前版本暂未提供 macOS 安装包，可关注后续 Release',
    items: [
      {label: '.dmg', description: '通用安装包，拖入 Applications 即可'},
      {label: 'x64 / arm64', description: 'Intel 芯片与 Apple Silicon（M 系列）'},
    ],
  },
  {
    title: 'Linux',
    iconSrc: '/img/app-icon-256.png',
    note: '当前版本暂未提供 Linux 安装包，可关注后续 Release',
    items: [
      {label: '.deb', description: 'Debian / Ubuntu 系'},
      {label: '.rpm', description: 'Fedora / RHEL 系'},
      {label: '.AppImage', description: '通用格式，无需安装'},
      {label: '.pacman', description: 'Arch Linux 系'},
    ],
  },
];
