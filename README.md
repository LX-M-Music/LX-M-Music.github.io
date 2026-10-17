# LX-M Music 官网

> LX-M Music 桌面版官方网站与文档站，基于 **Flutter Web** 构建。

[![Deploy](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml)
[![Auto Update](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml)

## 在线访问

**https://lx-m-music.github.io/**

- `/` 首页：ACG 媒体背景轮换、打字机效果、功能总览、版本对比
- `/download` 软件下载：镜像测速、版本选择与更新说明
- `/docs` 文档：20 篇详细指南（独立 `/docs` 路由）

## 技术栈

- **Flutter Web**（Material 3，CanvasKit 渲染，SPA 路由 go_router）
- 打包 **NotoSansSC** 变量字体（国内访客无法访问 fonts.gstatic，必须内置）
- t.alcy.cc 随机图接口经 `HtmlElementView` 原生 `<img>/<video>` 展示（无 CORS 头，不能走 Flutter 画布）

## 首页媒体背景（防闪烁设计）

所有背景素材（ACG 动图 MP4 + 萌图 webp）只在进入页面时各请求一次（随机接口天然每次不同），分层常驻；仅在**已就绪**的层之间轮换淡入淡出，任何时刻都有完整画面垫底，不会闪烁。视频仅在轮到它时播放，切走即暂停。

## 下载页镜像体系（全自动）

1. 内置清单 `assets/data/mirrors.json`：每日定时任务从 moretools.app、github.akams.cn 聚合站爬取刷新（约 155 节点）
2. 运行时再经公共 CORS 代理实时发现新节点并并入
3. 每位访客打开页面即用**自己的网络**并发实测全部节点（no-cors HEAD，JS interop），自动预选最快
4. 版本下拉列出最近 10 个发布（含旧版本），选中版本的完整更新说明就地展示，文件列表跟随切换

## 文档热更新

- 手写文档（`assets/docs-content/`）运行时从 GitHub raw → jsDelivr → 加速镜像拉取，更新文档**无需重新部署站点**
- 上游文档（README/FAQ/更新日志/Win7）实时同步自应用仓库 master 分支
- 全部链路失败时回退到打包快照（每日定时任务刷新）

## 本地开发

```bash
# 需要 Flutter 3.24+（推荐 stable 渠道）与 Node 18+（构建脚本）
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
export PUB_HOSTED_URL=https://pub.flutter-io.cn

git clone https://github.com/LX-M-Music/LX-M-Music.github.io.git
cd LX-M-Music.github.io
flutter pub get
node scripts/fetch-mirrors.mjs   # 生成镜像清单
node scripts/sync-app-docs.mjs   # 生成上游文档快照（需网络）
flutter run -d chrome            # 本地开发
flutter build web --release      # 产物 build/web/
```

## 自动化流水线

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `deploy.yml` | push 到 main | 刷新镜像清单 → `flutter build web` → 部署 GitHub Pages |
| `auto-update.yml` | 每日 UTC 21:20 / 手动 | 刷新镜像清单 + 上游文档快照，有变更自动提交触发部署 |

## 部署到国内服务器

`build/web/` 是纯静态产物（CanvasKit 与字体均已内置，无外部 CDN 依赖），可部署到任意机器：

```bash
flutter build web --release
rsync -avz build/web/ user@server:/var/www/lx-m-doc/
```

SPA 深链接需要回退到 `index.html`（Nginx：`try_files $uri /index.html;`）。

## 许可

- 站点文档内容：MIT
- 应用本体：Apache License 2.0 + 附加条款（见应用仓库）
