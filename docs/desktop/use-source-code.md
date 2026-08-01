---
sidebar_position: 7
---

# 源码使用方法

本项目与原版 LX Music 保持完全兼容的构建方式。

## 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+
- Git

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop.git
cd lx-m_lx-Miao-moe-music-desktop

# 安装依赖
npm install

# 开发模式（启动 Electron + 渲染进程热更新）
npm run dev

# 构建生产包
npm run build
```

## 项目结构（新增/修改部分）

```
src/
├── common/
│   ├── defaultSetting.ts              # 修改：新增 cookie.* / source.* 默认值
│   └── types/app_setting.d.ts         # 修改：新增 cookie.* / source.* 类型
└── renderer/
    ├── utils/
    │   ├── cookieManager.ts           # 新增：Cookie 统一管理工具
    │   └── musicSdk/
    │       ├── index.js               # 修改：内置音源 + 扩展音源动态注入
    │       ├── plugins/
    │       │   └── loader.js          # 新增：扩展音源插件加载器
    │       └── wy/api-cookie.js       # 新增：网易云 Cookie 同步辅助接口
    └── views/Setting/
        ├── index.vue                  # 修改：注册 Cookie / SourceExtra 面板
        └── components/
            ├── SettingCookie.vue      # 新增：Cookie 同步设置面板
            └── SettingSourceExtra.vue # 新增：音源面板（内置音源 + 预设链接）

ext-source-plugins/                    # 新增：可独立分发的扩展音源插件
├── README.md                          # 插件契约与启用说明
├── qs.plugin.js                       # 扩展音源插件示例
└── bili.plugin.js                     # 扩展音源插件示例
```

## 开发注意事项

1. **扩展音源插件**：修改 `src/renderer/utils/musicSdk/plugins/loader.js` 时请注意向后兼容
2. **Cookie 管理**：`cookieManager.ts` 是 Cookie 同步的核心，修改时请确保各平台字段映射正确
3. **Fluent UI 图标**：新图标请遵循 24×24 viewBox 规范，使用 `fill="currentColor"`

## 构建产物

构建完成后，产物位于 `dist_electron/` 目录下：

- `win-unpacked/` - Windows 未打包版本
- `mac/` - macOS 应用
- `linux-unpacked/` - Linux 未打包版本
- `*.exe` / `*.dmg` / `*.AppImage` / `*.deb` / `*.rpm` / `*.pacman` - 各平台安装包

## 贡献指南

欢迎提交 Issue 和 PR！请确保：

1. 代码风格与项目保持一致
2. 新增功能附带相应文档
3. 通过现有测试（如有）
4. 遵循 Apache License 2.0 协议
