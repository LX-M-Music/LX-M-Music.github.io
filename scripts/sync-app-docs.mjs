/**
 * 文档热更新：把应用仓库的 README / FAQ / CHANGELOG / Win7 兼容说明
 * 同步为文档站 docs/upstream/ 下的页面。
 *
 * - 相对图片/链接改写为应用仓库的绝对地址（同目录内页除外）；
 * - 对 Markdown 做 MDX 安全转义（代码块与行内代码除外），
 *   避免上游内容改动导致文档站构建失败；
 * - 由每日定时工作流调用；内容无变化时 git 提交为空，不会触发部署。
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'upstream');

const OWNER = 'LX-M-Music';
const REPO = 'lx-m_lx-Miao-moe-music-desktop';
const BRANCH = 'master';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const BLOB = `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}`;
const TREE = `https://github.com/${OWNER}/${REPO}/tree/${BRANCH}`;

// 同步到本目录内的文档：保留相对引用，交给 Docusaurus 解析与校验
const LOCAL_MAP = {
  './faq.md': './faq.md',
  './changelog.md': './changelog.md',
  './doc/win7-compatibility.md': './win7-compatibility.md',
};

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {'user-agent': 'lx-m-doc-sync'},
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/** raw.githubusercontent 连接不稳时回退到 GitHub contents API（base64） */
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

function rewriteLinks(md) {
  let out = md.replace(
    /\]\((\.\/[^)\s]+)\)/g,
    (match, p) => {
      const key = p.toLowerCase();
      if (LOCAL_MAP[key]) return `](${LOCAL_MAP[key]})`;
      if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(p)) return `](${RAW}/${p.slice(2)})`;
      if (/\.md$/i.test(p)) return `](${BLOB}/${p.slice(2)})`;
      return `](${TREE}/${p.slice(2)})`;
    },
  );
  out = out.replace(
    /src="(\.\.?\/[^"]+)"/g,
    (match, p) => `src="${RAW}/${p.replace(/^\.\.?\//, '')}"`,
  );
  return out;
}

const ALLOWED_TAGS =
  /^(a|abbr|b|blockquote|br|code|del|details|div|em|font|h[1-6]|hr|i|img|ins|kbd|li|mark|ol|p|picture|pre|s|source|span|strong|sub|summary|sup|table|tbody|td|tfoot|th|thead|tr|u|ul|video)$/i;

/** 对非代码内容做 MDX 安全转义：{ 与未知 JSX 标签 */
function sanitizeMdx(md) {
  let inFence = false;
  const lines = md.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const inlineCodes = [];
    let masked = line.replace(/`[^`]*`/g, segment => {
      inlineCodes.push(segment);
      return '\u0000C\u0000';
    });
    masked = masked.replace(/\{/g, '&#123;');
    masked = masked.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/g, (m, slash, tag) =>
      ALLOWED_TAGS.test(tag) ? m : `&lt;${slash}${tag}`,
    );
    // MDX/JSX 要求 void 元素必须自闭合：<img ...> -> <img ... />
    masked = masked.replace(
      /<(img|br|hr|input|source|meta|link)\b([^>]*?)(\s*\/)?>/gi,
      (m, tag, attrs) => `<${tag}${attrs || ''} />`,
    );
    masked = masked.replace(/\u0000C\u0000/g, () => inlineCodes.shift());
    return masked;
  });
  return lines.join('\n');
}

function page(title, position, description, body, note) {
  return `---
title: "${title}"
description: "${description}"
sidebar_position: ${position}
---

${note}

${sanitizeMdx(rewriteLinks(body))}
`;
}

/** 应用当前版本号（package.json），用于同步说明展示 */
async function fetchAppVersion() {
  try {
    const raw = await fetchSource('package.json');
    const pkg = JSON.parse(raw);
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

const appVersion = await fetchAppVersion();
const syncedAt = new Date(Date.now() + 8 * 3600 * 1000)
  .toISOString()
  .replace('T', ' ')
  .slice(0, 16);
const NOTE = `> 本页由脚本自动同步自应用仓库 [${OWNER}/${REPO}](https://github.com/${OWNER}/${REPO})${
  appVersion ? `（当前版本 v${appVersion}）` : ''
} · 同步时间 ${syncedAt}（UTC+8）。请勿直接编辑，内容以下游更新为准。`;

const SOURCES = [
  {
    file: 'README.md',
    output: 'readme.md',
    title: '应用完整说明（README）',
    description: 'LX-M Music 桌面版功能总览与构建指南，自动同步自应用仓库',
  },
  {
    file: 'FAQ.md',
    output: 'faq.md',
    title: '常见问题（上游 FAQ）',
    description: '应用仓库 FAQ，自动同步',
  },
  {
    file: 'CHANGELOG.md',
    output: 'changelog.md',
    title: '更新日志',
    description: 'LX-M Music 版本更新日志，自动同步',
  },
  {
    file: 'doc/win7-compatibility.md',
    output: 'win7-compatibility.md',
    title: 'Windows 7 兼容性说明',
    description: 'Win7/8 兼容版的构建与功能适配范围，自动同步',
  },
];

mkdirSync(outDir, {recursive: true});

let synced = 0;
for (const source of SOURCES) {
  try {
    const body = await fetchSource(source.file);
    writeFileSync(
      path.join(outDir, source.output),
      page(source.title, synced + 1, source.description, body, NOTE),
    );
    synced += 1;
    console.log(`已同步 ${source.file} -> docs/upstream/${source.output}`);
  } catch (err) {
    console.warn(`跳过 ${source.file}：${err.message}`);
  }
}

if (synced === 0) {
  console.error('上游文档全部同步失败');
  process.exit(1);
}
console.log(`✅ 完成：${synced}/${SOURCES.length} 篇上游文档已同步`);
