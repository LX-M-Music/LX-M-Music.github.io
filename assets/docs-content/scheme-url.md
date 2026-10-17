# Scheme URL 支持

从 v1.17.0 起支持 Scheme URL，可从浏览器等场景调用软件（上游还提供配套油猴脚本）。

## 基本规则

- URL 统一以 `lxmmusic://` 开头
- 源可用值：`kw/kg/tx/wy/mg`
- 音质可用值：`128k/320k/flac/flac24bit`
- 支持两种传参：`data`（URL 编码 JSON，适合复杂参数）与 `URL`（简单参数，v1.18.0+）

## data 方式传参

例：`lxmmusic://music/play?data=xxxx`（xxxx 为 URL 编码后的 JSON）

| 功能 | URL | 参数 |
| --- | --- | --- |
| 打开歌单 | `songlist/open` | `source`（必须）、`id`/`url`（必传一个） |
| 播放歌单 | `songlist/play` | `source`、`id`/`url`、`index`（可选，从 0 开始） |
| 搜索歌曲 | `music/search` | `keywords`（必须）、`source`（可选） |
| 播放歌曲 | `music/play` | `name`、`singer`、`source`、`songmid`（必传）；`img`、`albumId`、`interval`、`albumName`、`types`（可选）；平台特定参数 `hash`（kg 必传）、`strMediaMid`（tx 必传）、`copyrightId`（mg 必传）等 |

## URL 方式传参

| 功能 | URL | 参数 |
| --- | --- | --- |
| 搜索歌曲 | `music/search/{source}/{keywords}` | 例 `music/search/kw/xxx` |
| 打开歌单 | `songlist/open/{source}/{id/url}` | 例 `songlist/open/kw/123456` |

参数需 URL 编码。
