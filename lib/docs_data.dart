/// 文档站目录树。`source == 'app'` 的页面运行时从应用仓库热更新。
import 'models.dart';

const docSections = <DocSection>[
  DocSection('快速开始', [
    DocPage('intro', '简介与仓库关系'),
    DocPage('install', '安装指南'),
    DocPage('quick-start', '快速上手'),
  ]),
  DocSection('核心功能', [
    DocPage('search-playlist', '搜索与歌单'),
    DocPage('song-source-switch', '歌曲换源'),
    DocPage('cookie-sync', 'Cookie 同步'),
    DocPage('webdav-sync', 'WebDAV 数据同步'),
  ]),
  DocSection('音源与音质', [
    DocPage('custom-source', '自定义音源与音质'),
    DocPage('ext-source-plugin', '扩展音源插件与插件商店'),
  ]),
  DocSection('播放体验', [
    DocPage('playback-enhance', '播放增强'),
    DocPage('dynamic-background', '流动背景与封面缓存'),
    DocPage('desktop-lyric', '桌面歌词'),
  ]),
  DocSection('进阶', [
    DocPage('win7', 'Windows 7 兼容版'),
    DocPage('auto-update', 'Windows 自动更新'),
    DocPage('data-path', '数据存储路径'),
    DocPage('scheme-url', 'Scheme URL 支持'),
    DocPage('launch-args', '启动参数'),
  ]),
  DocSection('帮助', [
    DocPage('faq', '常见问题'),
    DocPage('source-code', '源码使用与构建'),
    DocPage('license', '许可协议'),
  ]),
  DocSection('上游文档（自动同步）', [
    DocPage('upstream-readme', '应用完整说明（README）', source: 'app'),
    DocPage('upstream-faq', '常见问题（上游 FAQ）', source: 'app'),
    DocPage('upstream-changelog', '更新日志', source: 'app'),
    DocPage('upstream-win7', 'Win7 兼容性说明', source: 'app'),
  ]),
];

DocPage? findDocPage(String id) {
  for (final section in docSections) {
    for (final page in section.pages) {
      if (page.id == id) return page;
    }
  }
  return null;
}

List<DocPage> get allDocPages =>
    [for (final section in docSections) ...section.pages];
