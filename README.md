# LX-M Music 文档站

> LX-M Music 桌面版官方文档与下载站点

[![Deploy](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/deploy.yml)
[![Auto Update](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml/badge.svg)](https://github.com/LX-M-Music/LX-M-Music.github.io/actions/workflows/auto-update.yml)

## 在线访问

**https://lx-m-music.github.io/**

## 特性

- 基于 [Docusaurus](https://docusaurus.io/)，Flutter / Material 3 扁平视觉风格，深色优先、亮色同样适配
- 下载页镜像体系全自动：
  - 每日定时任务从 moretools.app、github.akams.cn 聚合站爬取加速节点，刷新内置清单
  - 页面运行时再经公共 CORS 代理实时发现新节点（24 小时会话缓存）
  - 每位访客打开页面即用**自己的网络**并发实测全部节点，自动预选最快
- 文档热更新：每日自动同步应用仓库的 README / FAQ / 更新日志 / Win7 说明，有变更自动重新部署
- 全站图标使用应用真实图标（Windows 平台为原始 ICO 文件），无 emoji 图标
- 内置全文搜索，完全响应式

## 本地开发

```bash
git clone https://github.com/LX-M-Music/LX-M-Music.github.io.git
cd LX-M-Music.github.io
npm install
npm run start   # 开发服务器
npm run build   # 产物输出到 build/
npm run serve   # 本地预览构建产物
```

## 自动更新流水线

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `deploy.yml` | push 到 main | 构建并部署 GitHub Pages（构建前自动刷新镜像清单） |
| `auto-update.yml` | 每日 UTC 21:20 / 手动 | 刷新镜像清单 + 同步上游文档，有变更自动提交触发部署 |

因此正常情况下**无需任何人工干预**：应用仓库文档更新 → 次日文档站自动跟进；镜像聚合站列表变化 → 内置清单每日刷新 + 页面运行时兜底。

## 部署到国内服务器

`npm run build` 的产物是纯静态文件（`build/` 目录），无任何外部 CDN / 字体依赖，可部署到任意国内机器：

```bash
npm run build
# 将 build/ 目录同步到服务器，例如：
rsync -avz build/ user@server:/var/www/lx-m-doc/
```

Nginx 参考配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/lx-m-doc;
    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

国内访问时，下载页的 GitHub Release 信息获取与镜像发现均设计了失败兜底（内置清单 + 直连 Release 链接），即使 GitHub 不可达页面也能正常浏览与下载。

## 目录结构

```
docs/
├── desktop/          # 手写教程文档
└── upstream/         # 自动同步的应用仓库文档（勿手改，每日刷新）
    ├── readme.md
    ├── faq.md
    ├── changelog.md
    └── win7-compatibility.md
scripts/
├── fetch-mirrors.mjs   # 构建前爬取聚合站镜像清单 -> src/data/mirrors.json
└── sync-app-docs.mjs   # 同步应用仓库文档 -> docs/upstream/
src/
├── components/         # 页面组件
├── data/               # 站点数据（镜像清单、下载配置、首页内容）
└── pages/              # 首页与下载页
```

## 许可

本项目文档内容采用 [MIT](LICENSE) 协议。

## 致谢

- [Docusaurus](https://docusaurus.io/) - 文档站点生成器
- [LX Music](https://github.com/lyswhut/lx-music-desktop) - 原版项目
- [LX-M Music](https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop) - 本项目对应的桌面端软件
