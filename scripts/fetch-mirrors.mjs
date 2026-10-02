/**
 * 构建前抓取公共镜像聚合站的 GitHub 加速节点，生成 src/data/mirrors.json。
 *
 * 数据来源（任一成功即可，多源合并去重）：
 *  1. moretools.app 的 github-proxy 页面 —— SSR HTML 中内嵌加速前缀列表；
 *  2. github.akams.cn —— 节点列表编译在 Next.js chunk 里，形如 value:"gh.ddlc.top"。
 *
 * 列表随每次构建刷新；抓取失败时保留现有文件，首次构建失败则写入兜底节点。
 * 节点是否可用由访客在下载页用自己的网络实测决定，这里只负责发现。
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'src', 'data', 'mirrors.json');
const TIMEOUT_MS = 20_000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const HOST_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;
const FALLBACK = ['ghfast.top', 'ghproxy.net', 'gh-proxy.com'];

async function getText(url) {
  const res = await fetch(url, {
    headers: {'user-agent': UA, accept: 'text/html,application/json,*/*'},
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

// moretools.app：每条镜像渲染为 <span class="...font-mono...">https://host/</span>
async function fromMoretools() {
  const html = await getText('https://www.moretools.app/zh-CN/github-proxy');
  const hosts = new Set();
  const spanRe =
    /<span class="min-w-0 break-all font-mono text-sm text-foreground">(https?:\/\/[^<]+?)<\/span>/g;
  let m;
  while ((m = spanRe.exec(html)) !== null) {
    try {
      hosts.add(new URL(m[1]).hostname.toLowerCase());
    } catch {
      // 跳过无法解析的条目
    }
  }
  if (hosts.size === 0) throw new Error('moretools.app 页面结构变化，未解析到镜像');
  return hosts;
}

// github.akams.cn：抓首页拿到 chunk 清单，再从 chunk 中提取 value:"host"
async function fromAkams() {
  const html = await getText('https://github.akams.cn/');
  const chunks = [...new Set(
    [...html.matchAll(/\/_next\/static\/chunks\/[a-z0-9]+\.js/g)].map(m => m[0]),
  )];
  if (chunks.length === 0) throw new Error('github.akams.cn 未找到 chunk 清单');
  const hosts = new Set();
  await Promise.all(
    chunks.map(async chunk => {
      const js = await getText(`https://github.akams.cn${chunk}`);
      const valueRe = /value:"([a-z0-9.-]+\.[a-z]{2,})"/gi;
      let m;
      while ((m = valueRe.exec(js)) !== null) hosts.add(m[1].toLowerCase());
    }),
  );
  if (hosts.size === 0) throw new Error('github.akams.cn chunk 中未解析到节点');
  return hosts;
}

function persist(hosts) {
  const list = [...hosts].filter(h => HOST_RE.test(h)).sort();
  if (list.length < 5) throw new Error(`解析结果过少（${list.length} 个），保留现有列表`);
  mkdirSync(path.dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(list, null, 2)}\n`);
  return list.length;
}

const sources = await Promise.allSettled([
  fromMoretools().then(s => ({name: 'moretools.app', count: s.size, hosts: s})),
  fromAkams().then(s => ({name: 'github.akams.cn', count: s.size, hosts: s})),
]);

const merged = new Set();
for (const result of sources) {
  if (result.status === 'fulfilled') {
    console.log(`来源 ${result.value.name}：${result.value.count} 个节点`);
    for (const host of result.value.hosts) merged.add(host);
  } else {
    console.warn(`来源抓取失败：${result.reason?.message ?? result.reason}`);
  }
}

try {
  const count = persist(merged);
  console.log(`✅ src/data/mirrors.json 已更新：合并去重后 ${count} 个加速节点`);
} catch (err) {
  console.warn(`⚠️ ${err.message}`);
  if (existsSync(target)) {
    const current = JSON.parse(readFileSync(target, 'utf8'));
    console.log(`保留现有 ${current.length} 个节点继续构建`);
  } else {
    mkdirSync(path.dirname(target), {recursive: true});
    writeFileSync(target, `${JSON.stringify(FALLBACK, null, 2)}\n`);
    console.log(`首次构建且无缓存，已写入 ${FALLBACK.length} 个兜底节点`);
  }
}
