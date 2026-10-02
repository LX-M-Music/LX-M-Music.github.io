---
sidebar_position: 1
---

# LX-M Music 桌面版说明

> 在 [LX Music 桌面版](https://github.com/lyswhut/lx-music-desktop) 基础上扩展，新增可解耦的扩展音源插件机制与 Cookie 同步功能。

## 仓库关系

| 类型 | 仓库 | 说明 |
|------|------|------|
| **主仓库（上游）** | [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) | 原版，由落雪无痕维护，基于 Electron + Vue 3 |
| **参考仓库（移动版）** | [WalnutBai/lx-lxnetease-music-mobile-pro](https://github.com/WalnutBai/lx-lxnetease-music-mobile-pro) | Cookie 同步、Gitcode 音源等思路来源 |
| **本项目（LX-M）** | [Miao-moe/lx-m_lx-Miao-moe-music-desktop](https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop) | 本仓库，增量开发 |

## 新增功能概览

### 🔌 扩展音源插件机制

第三方平台音源不再内置进主程序，而是以**独立插件**形式存在：

- 主程序保持「干净的播放器」定位
- 插件可单独托管、单独更新
- 运行时由加载器动态注入
- 接口失效时**只需更新插件，无需主程序发版**

详见 [扩展音源插件](./ext-source-plugin.md)。

### 🍪 Cookie 同步设置

支持 **网易云、QQ音乐、酷狗、酷我、咪咕** 五大平台的 Cookie 同步：

- 播放记录同步：影响平台「每日推荐」算法
- 收藏歌单同步：本地收藏定期上报到平台「我喜欢」

> ⚠️ Cookie **仅用于同步**，不解锁高音质。高音质请通过「自定义源」配置。

详见 [Cookie 同步设置](./cookie-sync.md)。

### 🎨 Fluent UI 风格图标

全部图标重新设计为 **Microsoft Fluent UI** 风格：

- 24×24 viewBox，统一视觉重量
- `fill="currentColor"`，主题色自动跟随
- 从 18 个扩展到 **44 个**

### ⚡ 高级播放增强

- **无缝衔接（Gapless Playback）**：双 audio 引擎交叉淡化
- **渐入渐出（Fade-in / Fade-out）**：切歌音量平滑过渡，100-3000ms 可调
- **平滑动画**：全局 CSS 动画系统，0.5x-1.5x 速率可调

### ⌨️ 设置页快捷键

`Alt + ←` / `Alt + →` 切换上一个 / 下一个设置面板。

## 高音质解锁

**核心原则**：高音质通过「自定义音源」实现，与 Cookie 无关。

1. 打开「设置 → 音源 → 预设音源链接」
2. 点击「复制链接」，复制任一音源链接
3. 打开「设置 → 基本设置 → 自定义源 → 自定义源管理」
4. 选择「在线导入」→ 粘贴链接 → 确认
5. 回到「基本设置」选择刚导入的音源
6. 在「播放设置 → 优先播放的音质」中选择目标音质

详见 [自定义音源](./custom-source.md)。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop.git
cd lx-m_lx-Miao-moe-music-desktop

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产包
npm run build
```

## 技术栈

- Electron 30+
- Vue 3
- TypeScript
- Fluent UI System Icons

## 支持平台

- ✅ Windows 10 / 11（推荐）
- ✅ Windows 7 / 8 / 8.1（兼容版）
- ✅ macOS 10.15+
- ✅ Linux（deb / rpm / AppImage / pacman）

## 软件下载

前往 [软件下载](/download) 页面，支持多镜像链路测速，自动选择最优下载地址。

import DocCardList from '@theme/DocCardList';
