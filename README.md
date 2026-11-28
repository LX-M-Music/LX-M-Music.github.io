# LX-M Music 官网

> LX-M Music 桌面版官方网站与文档站，基于 **Astro** 静态构建。

[![Deploy](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml)
[![Auto Update](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml)

## 在线访问

**https://lx-m-music.github.io/**

- `/` 首页：ACG 媒体背景轮换、打字机效果、功能总览、版本对比
- `/download` 软件下载：镜像测速、版本选择与更新说明
- `/docs` 文档：20 篇手写指南 + 4 篇上游文档（独立 `/docs/:id` 路由）

## 技术栈

- **Astro 5** 静态站点生成器：文档与页面全部构建时预渲染为纯 HTML，**打开即是全文**
- 无运行时引擎、无字体下载（系统字体栈），国内访客**首屏秒开**
- 亮暗双主题（CSS 变量 + 持久化 + 跟随系统），多端响应式适配
- 客户端仅按需加载少量原生 TS 脚本（下载页测速、媒体背景轮换），无框架运行时
- t.alcy.cc 随机图接口经原生 `<img>/<video>` 展示（无 CORS 头）

## 加载 SplashScreen（仓鼠吉祥物）

每会话首次访问展示：透明底仓鼠贴纸 + 弹跳动画 + 进度条，随页面就绪淡出；
后续导航自动跳过，不挡用户。另有三张同风格生成动图（弹跳 / 摇摆 / 探头）可随机轮换。

## 首页媒体背景（防闪烁设计）

所有背景素材（ACG 动图 MP4 + 萌图 webp）只在进入页面时各请求一次（随机接口天然每次不同），分层常驻；仅在**已就绪**的层之间轮换淡入淡出，任何时刻都有完整画面垫底，不会闪烁。视频仅在轮到它时播放，切走即暂停。逻辑与旧 Flutter 版 `media_backdrop.dart` 一致。

## 下载页镜像体系（全自动）

1. 内置清单 `assets/data/mirrors.json`：每日定时任务从 moretools.app、github.akams.cn 聚合站爬取刷新（约 155 节点）
2. 运行时再经公共 CORS 代理实时发现新节点并并入
3. 每位访客打开页面即用**自己的网络**并发实测全部节点（no-cors HEAD），自动预选最快
4. 版本下拉列出最近 10 个发布（含旧版本），选中版本的完整更新说明就地展示（客户端 Markdown 渲染），文件列表跟随切换

## 文档更新方式

- 手写文档（`assets/docs-content/`）与上游快照（`assets/docs-upstream/`）在**构建时预渲染**为静态页面
- 每日定时任务自动同步上游文档（README/FAQ/更新日志/Win7）并刷新镜像清单，有变更即自动提交并触发重新部署
- 文档内容更新延迟 ≤ 1 天，且不再有运行时加载等待

## 本地开发

```bash
npm install
npm run dev      # 开发服务器 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建产物
```

## 目录结构

```
├── src/
│   ├── layouts/        # 站点骨架（顶栏/抽屉/页脚/主题/Splash）
│   ├── components/     # 媒体背景、打字机
│   ├── pages/          # 首页 / 下载 / 文档（静态路由）
│   ├── scripts/        # 下载页客户端逻辑（测速/发现/版本）
│   ├── lib/            # 文档目录树、构建时 Markdown 渲染
│   └── styles/         # 设计令牌与全局样式（亮暗主题）
├── public/             # 图标、加载吉祥物、robots.txt
├── assets/
│   ├── data/           # mirrors.json（每日自动刷新）
│   ├── docs-content/   # 手写文档（Markdown）
│   └── docs-upstream/  # 上游文档快照（每日自动同步）
├── scripts/            # 镜像清单抓取、上游文档同步
└── .github/workflows/  # 部署 + 每日自动更新
```

## 协议

站点内容 MIT；LX-M Music 基于 LX Music (Apache License 2.0) 构建。
