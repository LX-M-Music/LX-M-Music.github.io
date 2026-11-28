/**
 * 下载页客户端逻辑 — 与 Flutter 版 mirrors.dart / releases.dart / download_page.dart 一致：
 *  1. 内置镜像清单（构建时打包）先测速；运行时经公共 CORS 代理发现新节点并入；
 *  2. no-cors HEAD 并发实测（工作池 8），自动预选最快；
 *  3. GitHub API 拉取最近 10 个发布，版本下拉 + 更新说明（客户端 Markdown 渲染）；
 *  4. 平台卡片按命名规则匹配资产，每卡可切换镜像。
 */
import { renderMarkdown } from './markdown-client';

const GH_OWNER = 'LX-M-Music';
const GH_REPO = 'lx-m_lx-Miao-moe-music-desktop';
const RELEASES_URL = `https://github.com/${GH_OWNER}/${GH_REPO}/releases`;

interface MirrorConfig {
  id: string;
  name: string;
  kind: 'official' | 'proxy';
  testUrl: string;
}

interface ReleaseAsset {
  name: string;
  size: number;
  downloadCount: number;
  url: string;
}

interface ReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  body: string | null;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

/// 内置清单（构建时从 assets/data/mirrors.json 打包进本模块）
import bundledHosts from '../../assets/data/mirrors.json';

const mirrors: MirrorConfig[] = [
  { id: 'github', name: 'GitHub 官方', kind: 'official', testUrl: 'https://github.com/' },
  { id: 'github.akams.cn', name: 'Akams 加速', kind: 'proxy', testUrl: 'https://github.akams.cn/' },
  ...(bundledHosts as string[])
    .filter((host) => host !== 'github.akams.cn')
    .map((host) => ({ id: host, name: host, kind: 'proxy' as const, testUrl: `https://${host}/` })),
];

const speedResults = new Map<string, number | null>(); // id -> latency(ms) | null(失败)
let bestId: string | null = null;
const picks = new Map<string, string>(); // platformId -> mirrorId

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(2) : Math.round(v)} ${units[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// 测速（no-cors HEAD + AbortController 超时）
// ---------------------------------------------------------------------------

async function probeMirror(mirror: MirrorConfig, timeoutMs = 5000): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    await fetch(mirror.testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return Math.round(performance.now() - startedAt);
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function probeAll(
  targets: MirrorConfig[],
  onResult: (id: string, latency: number | null) => void,
  concurrency = 8,
): Promise<void> {
  let next = 0;
  async function worker(): Promise<void> {
    while (next < targets.length) {
      const mirror = targets[next++]!;
      const latency = await probeMirror(mirror);
      onResult(mirror.id, latency);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
}

function recomputeBest(): void {
  let best: { id: string; latency: number } | null = null;
  speedResults.forEach((latency, id) => {
    if (latency === null) return;
    if (!best || latency < best.latency) best = { id, latency };
  });
  bestId = best ? (best as { id: string; latency: number }).id : null;
}

// ---------------------------------------------------------------------------
// 运行时镜像发现（公共 CORS 代理抓聚合站）
// ---------------------------------------------------------------------------

const corsProxies: Array<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchViaProxies(url: string, timeoutMs = 10000): Promise<string | null> {
  for (const wrap of corsProxies) {
    try {
      const res = await fetch(wrap(url), {
        headers: { accept: 'text/html,application/json,*/*' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return await res.text();
    } catch (e) {
      // 尝试下一个代理
    }
  }
  return null;
}

const hostPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function extractMoretoolsHosts(html: string): string[] {
  const hosts = new Set<string>();
  const spanRe = /<span class="min-w-0 break-all font-mono text-sm text-foreground">(https?:\/\/[^<]+?)<\/span>/g;
  for (const m of html.matchAll(spanRe)) {
    try {
      hosts.add(new URL(m[1]!).host.toLowerCase());
    } catch (e) {}
  }
  if (hosts.size === 0) {
    const generic = /https?:\/\/([a-z0-9][a-z0-9.-]*\.[a-z]{2,})\//gi;
    for (const m of html.matchAll(generic)) {
      const host = m[1]!.toLowerCase();
      if (!host.includes('moretools') && !host.includes('google')) hosts.add(host);
    }
  }
  return [...hosts];
}

const akamsValue = /value:"([a-z0-9.-]+\.[a-z]{2,})"/gi;

function extractAkamsHosts(js: string): string[] {
  return [...js.matchAll(akamsValue)].map((m) => m[1]!.toLowerCase());
}

async function discoverRuntimeMirrors(timeoutMs = 12000): Promise<string[]> {
  const hosts = new Set<string>();

  const moretools = await fetchViaProxies('https://www.moretools.app/zh-CN/github-proxy', timeoutMs);
  if (moretools) extractMoretoolsHosts(moretools).forEach((h) => hosts.add(h));

  const home = await fetchViaProxies('https://github.akams.cn/', timeoutMs);
  if (home) {
    const chunks = [...new Set([...home.matchAll(/\/_next\/static\/chunks\/[a-z0-9]+\.js/g)].map((m) => m[0]!))].slice(0, 8);
    const results = await Promise.all(
      chunks.map((chunk) => fetchViaProxies(`https://github.akams.cn${chunk}`, timeoutMs)),
    );
    for (const js of results) {
      if (js) extractAkamsHosts(js).forEach((h) => hosts.add(h));
    }
  }

  return [...hosts].filter((h) => hostPattern.test(h));
}

function mergeDiscovered(current: MirrorConfig[], hosts: string[]): MirrorConfig[] {
  const known = new Set(current.map((m) => m.id));
  const fresh = hosts
    .filter((host) => !known.has(host) && host !== 'github.akams.cn')
    .map((host) => ({ id: host, name: host, kind: 'proxy' as const, testUrl: `https://${host}/` }));
  return fresh.length === 0 ? current : [...current, ...fresh];
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

async function fetchReleases(perPage = 10): Promise<ReleaseInfo[]> {
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases?per_page=${perPage}`, {
    headers: { accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 403) throw new Error('GitHub API 请求次数已达上限，请稍后重试');
  if (!res.ok) throw new Error(`GitHub API 返回 HTTP ${res.status}`);
  const list = (await res.json()) as Record<string, unknown>[];
  return list.map((item) => ({
    tag: (item.tag_name as string) ?? '',
    name: (item.name as string) ?? '',
    publishedAt: (item.published_at as string) ?? '',
    htmlUrl: (item.html_url as string) ?? '',
    body: (item.body as string) ?? null,
    prerelease: (item.prerelease as boolean) ?? false,
    assets: ((item.assets as Record<string, unknown>[]) ?? []).map((asset) => ({
      name: (asset.name as string) ?? '',
      size: (asset.size as number) ?? 0,
      downloadCount: (asset.download_count as number) ?? 0,
      url: (asset.browser_download_url as string) ?? '',
    })),
  }));
}

// ---------------------------------------------------------------------------
// 平台定义（与 Flutter 版完全一致的资产命名规则）
// ---------------------------------------------------------------------------

const updateArtifact = /(?:-update\.(?:bin|json)|\.blockmap)$/i;

interface PlatformDef {
  id: string;
  name: string;
  description: string;
  patterns: RegExp[];
}

const platforms: PlatformDef[] = [
  {
    id: 'windows',
    name: 'Windows',
    description: 'Windows 10 / 11 · x64 / x86 / ARM64',
    patterns: [
      /-win_(?:x64|x86|arm64)-(?:Setup\.exe|green\.7z)$/i,
      /-(?:x64|x86|x86_64|arm64)-(?:Setup\.exe|portable\.exe)$/i,
    ],
  },
  {
    id: 'win7',
    name: 'Windows 7 兼容版',
    description: 'Windows 7 / 8 / 8.1（x64 / x86，独立构建）',
    patterns: [/-win7_(?:x64|x86)-(?:Setup\.exe|green\.7z)$/i],
  },
  { id: 'macos', name: 'macOS', description: 'macOS 10.15+ · Intel / Apple Silicon', patterns: [/\.dmg$/i] },
  {
    id: 'linux',
    name: 'Linux',
    description: 'deb / rpm / AppImage / pacman',
    patterns: [/\.(?:deb|rpm|AppImage|pacman)$/i],
  },
];

function assetRank(name: string): number {
  const lower = name.toLowerCase();
  if (lower.endsWith('setup.exe')) return 0;
  if (lower.endsWith('portable.exe')) return 1;
  if (lower.endsWith('green.7z')) return 2;
  return 3;
}

function buildDownloadUrl(mirror: MirrorConfig, githubUrl: string): string {
  if (mirror.kind === 'official') return githubUrl;
  if (mirror.id === 'github.akams.cn') {
    return `https://github.akams.cn/?url=${encodeURIComponent(githubUrl)}`;
  }
  return `https://${mirror.id}/${githubUrl}`;
}

function mirrorById(id: string | null | undefined): MirrorConfig {
  return mirrors.find((m) => m.id === id) ?? mirrors[0]!;
}

// ---------------------------------------------------------------------------
// UI 渲染
// ---------------------------------------------------------------------------

const chipsEl = document.getElementById('mirror-chips')!;
const countEl = document.getElementById('speed-count')!;
const retestBtn = document.getElementById('retest-btn') as HTMLButtonElement;
const discoveredEl = document.getElementById('discovered-note')!;

let isTesting = false;

function latClass(latency: number | null): string {
  if (latency === null) return 'err';
  if (latency < 1500) return 'ok-fast';
  if (latency < 3000) return 'ok-mid';
  return '';
}

function renderChips(): void {
  const entries = mirrors.map((m) => ({ mirror: m, latency: speedResults.get(m.id) }));
  // 测完按延迟升序，失败与待测靠后
  const sorted = [...entries].sort((a, b) => {
    const rank = (e: typeof a) =>
      e.latency === undefined ? 1 << 31 : e.latency === null ? 1 << 30 : e.latency;
    return rank(a) - rank(b);
  });
  chipsEl.innerHTML = sorted
    .map(({ mirror, latency }) => {
      const isBest = !isTesting && bestId === mirror.id && latency !== null && latency !== undefined;
      const latText =
        latency === undefined ? '待测' : latency === null ? '不可用' : `${latency}ms`;
      const latCls = latency === undefined ? 'pending' : latClass(latency);
      return `<span class="mirror-chip${isBest ? ' best' : ''}">${
        isBest ? '<span class="trophy">🏆</span>' : ''
      }${esc(mirror.name)}<span class="lat ${latCls}">${latText}</span></span>`;
    })
    .join('');
  const done = [...speedResults.values()].filter((v) => v !== undefined).length;
  countEl.textContent = isTesting ? `已测 ${done}/${mirrors.length}` : `共 ${mirrors.length} 个节点`;
  retestBtn.disabled = isTesting;
  retestBtn.textContent = isTesting ? '测速中…' : '重新测速';
}

async function runSpeedTest(targets: MirrorConfig[]): Promise<void> {
  if (targets.length === 0) return;
  isTesting = true;
  for (const t of targets) if (!speedResults.has(t.id)) speedResults.set(t.id, undefined);
  renderChips();
  await probeAll(targets, (id, latency) => {
    speedResults.set(id, latency);
    recomputeBest();
    renderChips();
  });
  isTesting = false;
  recomputeBest();
  renderChips();
  renderPlatformCards();
}

retestBtn.addEventListener('click', () => runSpeedTest(mirrors));

// --- Release 面板 ---

let releases: ReleaseInfo[] | null = null;
let releasesError: string | null = null;
let selectedTag: string | null = null;

async function loadReleases(): Promise<void> {
  const loadingEl = document.getElementById('release-loading')!;
  const metaEl = document.getElementById('release-meta')!;
  const notesEl = document.getElementById('release-notes')!;
  try {
    releases = await fetchReleases();
    selectedTag = releases[0]?.tag ?? null;
    loadingEl.hidden = true;
    renderReleasePanel();
    renderPlatformCards();
  } catch (err) {
    releasesError = String(err instanceof Error ? err.message : err);
    loadingEl.hidden = true;
    const box = document.getElementById('error-box')!;
    box.hidden = false;
    box.className = 'panel error-panel';
    box.innerHTML = `
      <p class="error-title">获取版本信息失败：${esc(releasesError)}</p>
      <p class="error-sub">您可以尝试直接访问 GitHub Release 页面下载</p>
      <a class="btn btn-primary" href="${RELEASES_URL}" target="_blank" rel="noopener noreferrer">前往 GitHub Release</a>`;
  }
}

function renderReleasePanel(): void {
  if (!releases || releases!.length === 0) return;
  const headEl = document.getElementById('release-loading')!;
  headEl.hidden = true;
  const metaEl = document.getElementById('release-meta')!;
  const notesEl = document.getElementById('release-notes')!;

  const options = releases!
    .map((r, i) => {
      const label = `${r.tag}${i === 0 ? '（最新）' : ''}${r.prerelease ? '（预发布）' : ''} · ${formatDate(r.publishedAt)}`;
      return `<option value="${esc(r.tag)}" ${r.tag === selectedTag ? 'selected' : ''}>${esc(label)}</option>`;
    })
    .join('');

  metaEl.hidden = false;
  metaEl.innerHTML = `
    <select class="pill-select" id="tag-select" aria-label="选择版本">${options}</select>
    <span id="tag-badges"></span>
    <span id="tag-date"></span>
    <a id="tag-link" href="#" target="_blank" rel="noopener noreferrer">Release 详情</a>`;

  const tagSelect = document.getElementById('tag-select') as HTMLSelectElement;
  tagSelect.addEventListener('change', () => {
    selectedTag = tagSelect.value;
    renderTagDetails();
    renderPlatformCards();
  });
  renderTagDetails();
}

function renderTagDetails(): void {
  const release = releases?.find((r) => r.tag === selectedTag) ?? releases?.[0];
  if (!release) return;
  const badges = document.getElementById('tag-badges')!;
  const dateEl = document.getElementById('tag-date')!;
  const linkEl = document.getElementById('tag-link')!;
  const notesEl = document.getElementById('release-notes')!;

  badges.innerHTML = release.prerelease ? '<span class="badge pre">预发布</span>' : '';
  dateEl.textContent = `发布于 ${formatDate(release.publishedAt)}`;
  linkEl.href = release.htmlUrl;
  notesEl.hidden = false;
  notesEl.innerHTML = renderMarkdown(
    release.body && release.body.trim().length > 0 ? release.body : '本次发布没有填写更新说明。',
  );
}

// --- 平台卡片 ---

function renderPlatformCards(): void {
  const grid = document.getElementById('platforms-grid')!;
  if (releasesError) {
    grid.hidden = true;
    return;
  }
  const release = releases?.find((r) => r.tag === selectedTag) ?? releases?.[0];

  grid.innerHTML = platforms
    .map((platform) => {
      const assets = release
        ? release.assets
            .filter((a) => !updateArtifact.test(a.name))
            .filter((a) => platform.patterns.some((p) => p.test(a.name)))
            .sort((a, b) => assetRank(a.name) - assetRank(b.name))
        : [];

      const effectivePick = picks.get(platform.id) ?? bestId ?? 'github';
      const options = mirrors
        .map((m) => {
          const lat = speedResults.get(m.id);
          const latLabel =
            lat === undefined ? '' : lat === null ? '（不可用）' : `（${lat}ms）`;
          return `<option value="${esc(m.id)}" ${m.id === effectivePick ? 'selected' : ''}>${esc(
            m.name + latLabel,
          )}</option>`;
        })
        .join('');

      const items = assets
        .map((asset) => {
          const url = buildDownloadUrl(mirrorById(effectivePick), asset.url);
          return `
          <div class="asset-item">
            <span class="a-name">${esc(asset.name)}</span>
            <span class="a-meta">${formatBytes(asset.size)} · ${asset.downloadCount} 次下载</span>
            <a class="btn btn-primary" href="${esc(url)}" download>下载</a>
          </div>`;
        })
        .join('');

      return `
      <section class="panel">
        <div class="platform-head">
          <img src="/icons/Icon-192.png" alt="" width="40" height="40" />
          <div>
            <b>${esc(platform.name)}</b>
            <span>${esc(platform.description)}</span>
          </div>
        </div>
        <div class="mirror-row">
          <label>下载镜像</label>
          <select class="pill-select mirror-pick" data-platform="${esc(platform.id)}" aria-label="选择下载镜像">${options}</select>
        </div>
        <div class="asset-list">${
          items || '<p class="mirror-hint">该平台在所选版本暂无安装包，可关注后续 Release</p>'
        }</div>
      </section>`;
    })
    .join('');

  grid.querySelectorAll<HTMLSelectElement>('.mirror-pick').forEach((sel) => {
    sel.addEventListener('change', () => {
      picks.set(sel.dataset.platform!, sel.value);
      renderPlatformCards();
    });
  });
}

// ---------------------------------------------------------------------------
// 启动
// ---------------------------------------------------------------------------

void (async function bootstrap() {
  // 内置清单先测速；运行时发现的节点随后并入
  await runSpeedTest(mirrors);
  void loadReleases();

  const hosts = await discoverRuntimeMirrors();
  const known = new Set(mirrors.map((m) => m.id));
  const merged = mergeDiscovered(mirrors, hosts);
  if (merged.length > mirrors.length) {
    const fresh = merged.slice(mirrors.length);
    mirrors.length = 0;
    mirrors.push(...merged);
    discoveredEl.textContent = ` 本页已实时发现 ${fresh.length} 个新节点，内置清单每日自动刷新。`;
    await runSpeedTest(fresh);
  } else {
    discoveredEl.textContent = ' 内置清单每日自动刷新。';
  }
  void known;
})();
