/**
 * 下载页领域模块：镜像清单、访客侧测速、Release 资产匹配与展示格式化。
 */
import mirrorHosts from './mirrors.json';

export const GITHUB_OWNER = 'Miao-moe';
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

/** 种子镜像（GitHub 官方 + Akams）+ 构建期从聚合站抓取的加速节点 */
export function loadMirrors(): MirrorConfig[] {
  const proxies: MirrorConfig[] = mirrorHosts
    .filter(host => host !== 'github.akams.cn')
    .map(host => ({
      id: host,
      name: host,
      kind: 'proxy' as const,
      testUrl: `https://${host}/`,
      buildDownloadUrl: githubUrl => `https://${host}/${githubUrl}`,
    }));
  return [OFFICIAL, AKAMS, ...proxies];
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

/** 并发探测全部镜像，每完成一个立即回调，供页面流式刷新 */
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
  icon: string;
  description: string;
  /** 命中任一规则的安装包归入该平台 */
  patterns: RegExp[];
}

/** 自动更新增量包 / 校验文件等非安装产物 */
const NON_INSTALLER_RE = /(?:-update\.(?:bin|json)|\.blockmap)$/i;

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'windows',
    name: 'Windows',
    icon: '🪟',
    description: 'Windows 10 / 11 · x64 / x86 / ARM64',
    patterns: [
      /-win_(?:x64|x86|arm64)-(?:Setup\.exe|green\.7z)$/i,
      /-(?:x64|x86|x86_64|arm64)-(?:Setup\.exe|portable\.exe)$/i,
    ],
  },
  {
    id: 'win7',
    name: 'Windows 7 兼容版',
    icon: '🪟',
    description: 'Windows 7 / 8 / 8.1（x64 / x86，独立构建）',
    patterns: [/-win7_(?:x64|x86)-(?:Setup\.exe|green\.7z)$/i],
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: '🍎',
    description: 'macOS 10.15+ · Intel / Apple Silicon',
    patterns: [/\.dmg$/i],
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: '🐧',
    description: 'deb / rpm / AppImage / pacman',
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
  icon: string;
  title: string;
  note?: string;
  items: GuideItem[];
}

export const INSTALL_GUIDE: GuideSection[] = [
  {
    icon: '🪟',
    title: 'Windows',
    items: [
      {label: 'Setup.exe', description: '标准安装版，支持自动更新'},
      {label: 'portable.exe', description: '便携版，单文件免安装'},
      {label: 'green.7z', description: '绿色版，解压即用'},
      {label: 'x64 / x86 / arm64', description: '64 位、32 位与 ARM 架构'},
      {label: 'win7_ 前缀', description: 'Windows 7/8/8.1 兼容版（基于 Electron 22）'},
    ],
  },
  {
    icon: '🍎',
    title: 'macOS',
    note: '当前版本暂未提供 macOS 安装包，可关注后续 Release',
    items: [
      {label: '.dmg', description: '通用安装包，拖入 Applications 即可'},
      {label: 'x64 / arm64', description: 'Intel 芯片与 Apple Silicon（M 系列）'},
    ],
  },
  {
    icon: '🐧',
    title: 'Linux',
    note: '当前版本暂未提供 Linux 安装包，可关注后续 Release',
    items: [
      {label: '.deb', description: 'Debian / Ubuntu 系'},
      {label: '.rpm', description: 'Fedora / RHEL 系'},
      {label: '.AppImage', description: '通用格式，无需安装'},
      {label: '.pacman', description: 'Arch Linux 系'},
    ],
  },
];
