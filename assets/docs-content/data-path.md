# 数据存储路径

默认情况下，软件的数据存储在：

| 平台 | 路径 |
| --- | --- |
| Windows | `%APPDATA%/LX-M Music` |
| Linux | `$XDG_CONFIG_HOME/LX-M Music` 或 `~/.config/LX-M Music` |
| macOS | `~/Library/Application Support/LX-M Music` |

## 便携模式（Windows）

程序目录下存在 `portable` 目录时，自动使用该目录作为数据存储目录。便携数据、歌单、下载文件与个人文件不属于程序更新范围。

## 数据安全相关

- WebDAV 同步替换本机数据前，会在数据目录保留 `webdav-local-backup.json`（最近一次覆盖前的副本）
- `webdav.json` 保存当前同步目标的基线与上次结果，均在本地
- 资源缓存（封面等）可通过「设置 → 其他设置 → 资源缓存」清理，不影响歌单数据
