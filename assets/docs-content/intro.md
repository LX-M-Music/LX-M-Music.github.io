# 简介与仓库关系

LX-M Music 是一个**免费开源**的桌面音乐播放器，基于 [LX Music（洛雪音乐桌面版）](https://github.com/lyswhut/lx-music-desktop) 深度增强，新增可解耦的扩展音源插件机制、五平台 Cookie 同步、歌曲换源、WebDAV 多端同步等一系列功能。

## 仓库关系

| 类型 | 仓库 | 说明 |
| --- | --- | --- |
| 上游 | [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) | 原版洛雪音乐桌面版，由落雪无痕维护，Electron + Vue 3 |
| 参考 | [移动版项目](https://github.com/WalnutBai/lx-lxnetease-music-mobile-pro) | Cookie 同步、备用搜索等思路来源 |
| 本项目 | [LX-M-Music/lx-m_lx-Miao-moe-music-desktop](https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop) | LX-M 桌面版，增量开发 |

## 功能总览

- **搜索与歌单**：酷我、酷狗、QQ 音乐、网易云、咪咕五平台搜索；歌单、排行榜、歌手与专辑详情页
- **歌曲换源**：按歌名、歌手、时长智能匹配候选版本，跨平台一键替换
- **Cookie 同步**：五大平台登录状态导入，自建歌单导入与修改回传，播放记录上报
- **WebDAV 数据同步**：歌单、下载记录、系统设置多设备同步，与手机版互通
- **自定义音源**：支持 128k 到 master 七档音质，失败自动降级重试
- **插件商店**：官方插件一键安装；扩展音源插件机制与主程序解耦
- **播放增强**：无缝衔接、渐入渐出、平滑动画、设置页快捷键
- **流动背景**：专辑封面生成流动背景，按钮颜色可跟随
- **Win7 兼容版**：基于 Electron 22 的独立维护版本

## 技术栈

Electron 30+（Win7 版为 Electron 22）· Vue 3 · TypeScript · Fluent UI System Icons

## 协议

项目继承上游 Apache License 2.0 并附加补充条款，详见[许可协议](/docs/license)。
