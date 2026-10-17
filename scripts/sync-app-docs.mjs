/**
 * 上游文档快照同步：把应用仓库的 README / FAQ / CHANGELOG / Win7 兼容说明
 * 下载为打包内置的兜底快照（assets/docs-upstream/）。
 *
 * 站点运行时会优先直接从应用仓库拉取最新内容（热更新），这些快照仅在
 * GitHub 不可达时兜底，由每日定时任务刷新。输出为纯 Markdown（Flutter 端渲染）。
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'docs-upstream');

const OWNER = 'LX-M-Music';
const REPO = 'lx-m_lx-Miao-moe-music-desktop';
const BRANCH = 'master';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {'user-agent': 'lx-m-doc-sync'},
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/** raw 不稳时回退 GitHub contents API（base64） */
async function fetchApiFallback(file) {
  const headers = {'user-agent': 'lx-m-doc-sync'};
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${file}?ref=${BRANCH}`,
    {headers, signal: AbortSignal.timeout(30_000)},
  );
  if (!res.ok) throw new Error(`contents API -> HTTP ${res.status}`);
  const data = await res.json();
  return Buffer.from(data.content, 'base64').toString('utf8');
}

async function fetchSource(file) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fetchText(`${RAW}/${file}`);
    } catch (err) {
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  return fetchApiFallback(file).catch(err => {
    throw lastError ?? err;
  });
}

/** 应用当前版本号（package.json），用于文档头部说明 */
async function fetchAppVersion() {
  try {
    return JSON.parse(await fetchSource('package.json')).version ?? null;
  } catch {
    return null;
  }
}

const SOURCES = [
  {file: 'README.md', output: 'upstream-readme.md', title: '应用完整说明（README）'},
  {file: 'FAQ.md', output: 'upstream-faq.md', title: '常见问题（上游 FAQ）'},
  {file: 'CHANGELOG.md', output: 'upstream-changelog.md', title: '更新日志'},
  {file: 'doc/win7-compatibility.md', output: 'upstream-win7.md', title: 'Windows 7 兼容性说明'},
];

const appVersion = await fetchAppVersion();
const syncedAt = new Date(Date.now() + 8 * 3600 * 1000)
  .toISOString()
  .replace('T', ' ')
  .slice(0, 16);

mkdirSync(outDir, {recursive: true});

let synced = 0;
for (const source of SOURCES) {
  try {
    const body = await fetchSource(source.file);
    const header = [
      `> 本页由脚本自动同步自应用仓库 [${OWNER}/${REPO}](https://github.com/${OWNER}/${REPO})${appVersion ? `（当前版本 v${appVersion}）` : ''} · 同步时间 ${syncedAt}（UTC+8）。`,
      '',
      '',
    ].join('\n');
    writeFileSync(path.join(outDir, source.output), header + body);
    synced += 1;
    console.log(`已同步 ${source.file} -> assets/docs-upstream/${source.output}`);
  } catch (err) {
    console.warn(`跳过 ${source.file}：${err.message}`);
  }
}

if (synced === 0) {
  console.error('上游文档全部同步失败');
  if (!existsSync(outDir) || readFileSync(path.join(outDir, SOURCES[0].output), 'utf8').length === 0) {
    process.exit(1);
  }
  console.log('保留现有快照继续');
}
console.log(`✅ 完成：${synced}/${SOURCES.length} 篇上游文档快照已更新`);
