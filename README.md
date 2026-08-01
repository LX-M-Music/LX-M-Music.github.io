# LX-M Doc

> LX-M Music 桌面版官方文档站点

[![Deploy](https://github.com/Miao-moe/lx-m-doc/actions/workflows/deploy.yml/badge.svg)](https://github.com/Miao-moe/lx-m-doc/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌐 在线预览

**https://miao-moe.github.io/lx-m-doc/**

## ✨ 特性

- 📖 基于 [Docusaurus](https://docusaurus.io/) 构建的现代化文档站点
- 🎨 深色主题 + 绿色强调色，Fluent UI 风格
- 🚀 多镜像下载测速，自动选择最优 GitHub 下载链路
- 📱 完全响应式，支持移动端浏览
- 🔍 内置全文搜索
- ⚡ GitHub Actions 自动部署

## 🛠️ 本地开发

```bash
# 克隆仓库
git clone https://github.com/Miao-moe/lx-m-doc.git
cd lx-m-doc

# 安装依赖
npm install

# 启动开发服务器
npm run start

# 构建
npm run build

# 本地预览构建产物
npm run serve
```

## 🚀 一键部署

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本支持以下部署方式：
1. **GitHub Pages** - 推送到 gh-pages 分支
2. **远程服务器** - 通过 rsync/scp 部署
3. **本地预览** - 构建后启动 serve

## 📁 文档结构

```
docs/
├── desktop/
│   ├── index.md              # 首页/快速开始
│   ├── custom-source.md      # 自定义音源
│   ├── ext-source-plugin.md  # 扩展音源插件
│   ├── cookie-sync.md        # Cookie 同步
│   ├── datapath.md           # 数据存储路径
│   ├── use-source-code.md    # 源码使用
│   ├── license.md            # 许可协议
│   └── faq/                  # 常见问题
│       ├── index.md
│       ├── playlist.md
│       ├── hotkey.md
│       └── antivirus.md
```

## 🎨 主题定制

主题色采用绿色系（`#4ade80`），与 LX-M Music 品牌色保持一致。

```css
:root {
  --ifm-color-primary: #4ade80;
  --ifm-color-primary-dark: #22c55e;
  --ifm-color-primary-darker: #16a34a;
}
```

## 📄 许可

本项目文档内容采用 [MIT](LICENSE) 协议。

## 🙏 致谢

- [Docusaurus](https://docusaurus.io/) - 文档站点生成器
- [LX Music](https://github.com/lyswhut/lx-music-desktop) - 原版项目
- [LX-M Music](https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop) - 本项目对应的桌面端软件
