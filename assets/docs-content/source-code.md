# 源码使用与构建

## 环境要求

- Node.js 22+ 与 npm
- Windows 10/11 构建环境（构建 Win7 兼容版同样在 Win10/11 上进行）
- 平台原生依赖（详见仓库 README）

## 日常开发

```bash
# 克隆仓库
git clone https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop.git
cd lx-m_lx-Miao-moe-music-desktop

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产包
npm run build
```

## 构建产物说明

- 第一步会清理 `build/` 中的普通版产物，保留独立的 `build/win7/`；普通版旧包请在构建前另存
- Win7 兼容版单独构建，产物位于 `build/win7/artifacts/`，文件名带 `win7_` 前缀
- macOS、Linux 的构建脚本与目标架构参见仓库 `package.json`，需要相应环境及原生依赖

## Win7 兼容版构建

```powershell
npm ci
npm run build:win7
npm run test:win7
npm run pack:win7:setup:x64
npm run pack:win7:7z:x64
npm run pack:win7:setup:x86
npm run pack:win7:7z:x86
```

- `build/win7/workspace/`：自动生成的隔离工作区，不要作为日常编辑目录
- `npm run prepare:win7`：恢复 x64 原生绑定，不编译应用
- 打包 x86 后如需重新运行 x64 测试，先执行 `npm run prepare:win7`

详见 [Win7 兼容版](/docs/win7)。

## 代码检查与自动化回归

```bash
npm run lint

# Cookie 歌单、缩略图、歌单缓存、封面地址缓存和生产请求回归
node --test tests/cookie-playlists.test.cjs tests/playlist-writeback.test.cjs tests/playlist-writeback-api.test.cjs tests/cover-thumbnail.test.cjs tests/list-data-cache.test.cjs tests/music-cover-cache.test.cjs tests/request.production.test.cjs

# 歌单回传界面和持久化检查（先构建 main、renderer）
node --test tests/playlist-writeback.electron.test.cjs

# 换源候选、试听目标、替换事务及界面回归
node --test tests/music-toggle.test.cjs tests/music-toggle.electron.test.cjs

# 动效设置、封面缓存、列表加载方式等界面回归（需先 npm run dev）
node --test --test-concurrency=1 tests/motion.electron.test.cjs tests/motion-restart.electron.test.cjs tests/cover-image.electron.test.cjs tests/list-cache.electron.test.cjs
```

界面测试使用临时用户数据目录，覆盖快速切页、播放详情展开收起、重启后动效设置保持、歌单与封面缓存复用等场景。

## 代码入口

| 模块 | 位置 |
| --- | --- |
| 动画开关与时序 | `src/renderer/utils/smoothAnimation.ts`、`motion.ts` |
| 页面切换与详情动效 | `MotionView.vue`、`usePlayerDetailMotion.ts` |
| 封面组件与磁盘缓存 | `CoverImage.vue`、`artworkStorage.ts` |
| 本地歌单读取与预热 | `rendererListManage.ts`、`useDataInit.ts` |
| 平台歌单导入与分组 | `cookieSync.ts`、`useFolders.ts` |
| 播放记录上报 | `playHistoryReporter.ts` |
| 桌面歌词 | `SettingDesktopLyric.vue`、`src/renderer-lyric/App.vue` |
| 插件商店与官方插件 | `src/main/modules/optionalPlugins/manager.ts`、`src/optional-plugins` |

## 开发者扩展音源

| 项目 | 说明 |
| --- | --- |
| 配置入口 | `window.__lxExtSourcePlugins__` |
| 加载方式 | 本地工厂函数或远程脚本 |
| 参考资料 | `ext-source-plugins/README.md`、`src/renderer/utils/musicSdk/plugins/loader.js` |
