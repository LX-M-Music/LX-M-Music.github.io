/**
 * 文档目录树 — 与 Flutter 版 docs_data.dart 一致。
 * `source: 'site'`  = 本仓库手写文档（assets/docs-content/）
 * `source: 'app'`   = 上游文档，每日自动同步应用仓库（assets/docs-upstream/）
 */

export interface DocPageDef {
  id: string;
  title: string;
  source: 'site' | 'app';
}

export interface DocSectionDef {
  title: string;
  pages: DocPageDef[];
}

const p = (id: string, title: string, source: 'site' | 'app' = 'site'): DocPageDef => ({
  id,
  title,
  source,
});

export const docSections: DocSectionDef[] = [
  {
    title: '快速开始',
    pages: [p('intro', '简介与仓库关系'), p('install', '安装指南'), p('quick-start', '快速上手')],
  },
  {
    title: '核心功能',
    pages: [
      p('search-playlist', '搜索与歌单'),
      p('song-source-switch', '歌曲换源'),
      p('cookie-sync', 'Cookie 同步'),
      p('webdav-sync', 'WebDAV 数据同步'),
    ],
  },
  {
    title: '音源与音质',
    pages: [
      p('custom-source', '自定义音源与音质'),
      p('ext-source-plugin', '扩展音源插件与插件商店'),
    ],
  },
  {
    title: '播放体验',
    pages: [
      p('playback-enhance', '播放增强'),
      p('dynamic-background', '流动背景与封面缓存'),
      p('desktop-lyric', '桌面歌词'),
    ],
  },
  {
    title: '进阶',
    pages: [
      p('win7', 'Windows 7 兼容版'),
      p('auto-update', 'Windows 自动更新'),
      p('data-path', '数据存储路径'),
      p('scheme-url', 'Scheme URL 支持'),
      p('launch-args', '启动参数'),
    ],
  },
  {
    title: '帮助',
    pages: [p('faq', '常见问题'), p('source-code', '源码使用与构建'), p('license', '许可协议')],
  },
  {
    title: '上游文档（自动同步）',
    pages: [
      p('upstream-readme', '应用完整说明（README）', 'app'),
      p('upstream-faq', '常见问题（上游 FAQ）', 'app'),
      p('upstream-changelog', '更新日志', 'app'),
      p('upstream-win7', 'Win7 兼容性说明', 'app'),
    ],
  },
];

export const allDocPages: DocPageDef[] = docSections.flatMap((s) => s.pages);

export function findDocPage(id: string): DocPageDef | undefined {
  return allDocPages.find((page) => page.id === id);
}

/** 构建/兜底时读取的 Markdown 文件路径（仓库内）。 */
export function docAssetPath(page: DocPageDef): string {
  return page.source === 'app'
    ? `assets/docs-upstream/${page.id}.md`
    : `assets/docs-content/${page.id}.md`;
}
