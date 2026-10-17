# Windows 7 兼容版

兼容版固定 **Electron 22.3.27**（内含 Node 16.17.1、Chromium 108.0.5359.215），普通版继续使用原来的 Electron 版本，两套依赖互不覆盖，功能共用同一份源码。

Electron 22 是官方支持 Windows 7/8/8.1 的最后一个大版本，现已停止维护。兼容版固定旧内核，目标环境为 **Windows 7 SP1**。

## 更新渠道

- Win7 运行时只选择带 `win7_` 前缀的对应架构安装包
- 普通版自动排除 Win7 包
- 发布元数据使用独立 `win7` 渠道

## 适配内容

| 范围 | 方法 |
| --- | --- |
| 内核与语法 | Electron 锁 22.3.27，TypeScript 目标 ES2022 |
| 网络/代理/下载/更新 | Undici 固定 5.29.0，共享兼容层处理重定向、重试、取消 |
| SQLite 歌单与回收站 | better-sqlite3 固定 9.6.0，按 ABI 110 分别准备 x64/x86 绑定；保留 30 天回收规则 |
| 本地音频与歌词 | music-metadata 固定 8.3.0，兼容字符串与对象形式歌词标签 |
| 音效与输出设备 | 保留 Web Audio 处理链；Chrome 108 缺 setSinkId 时通过 MediaStream 方案选择输出设备 |
| 插件商店与 ZIP | 使用 WASM 版编译工具，兼容 Node 16 |
| 迷你播放器/动态背景/歌词 | 全部保留，使用旧内核回归验证 |

## 构建产物

- 安装版：`win7_x64-Setup.exe` / `win7_x86-Setup.exe`
- 绿色版：`win7_x64-green.7z` / `win7_x86-green.7z`
- 四个包的 SHA-256 在 `build/win7/artifacts/SHA256SUMS.txt`

## 验证状态

自动化回归覆盖：重定向/重试、播放衔接、队列失效、元数据解析、数据库迁移与回收、音量均衡、音效、标签编辑、插件导入/编译/导出、歌词样式、迷你播放器、动态背景、WebDAV 和更新选择；成品验证含启动 EXE/DLL 检查、ASAR 加载、SQLite 读写、本地 WAV 播放与离线插件编译。

在 Win7 实机/虚拟机上验收的项目（安装/卸载、真实声卡输出切换、旧显卡动态背景、中文输入法、热键与托盘、平台登录等）仍有待完成，详见应用仓库 `doc/win7-compatibility.md`。
