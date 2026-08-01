---
sidebar_position: 4
---

# 扩展音源插件

LX-M Music 提供一套**扩展音源插件机制**，允许第三方平台以独立插件形式注册为可用音源，彻底解耦于主程序。

## 设计原则

- **主程序保持干净**：不含任何平台专有接口 / 签名逻辑
- **插件独立托管**：可单独更新，接口失效时不影响主程序
- **动态注入**：运行时由加载器注入，加载失败静默跳过
- **零耦合**：插件与主程序之间通过标准契约通信

## 插件契约

扩展音源插件是一个 JavaScript 文件，需导出以下接口：

```js
module.exports = {
  info: {
    name: '扩展音源名称',
    id: 'unique-source-id',
    author: '作者名',
    version: '1.0.0',
    description: '音源描述',
  },
  // 搜索歌曲
  async searchMusic(keyword, page, limit) {
    // 返回 { list: [...], total: number }
  },
  // 获取歌曲 URL
  async getMusicUrl(songInfo, quality) {
    // 返回 { url: string, ... }
  },
  // 获取歌词
  async getLyric(songInfo) {
    // 返回 { lyric: string, tlyric?: string }
  },
  // 获取歌曲封面
  async getPic(songInfo) {
    // 返回 { url: string }
  },
  // 获取歌单信息
  async getListInfo(id) {
    // 返回 { info: {...}, list: [...] }
  },
};
```

## 启用方式

### 方式一：通过 `window.__lxExtSourcePlugins__` 配置

在主程序中通过开发者工具或注入脚本设置：

```js
window.__lxExtSourcePlugins__ = [
  'https://example.com/path/to/your-plugin.js',
  '/local/path/to/plugin.js',
];
```

### 方式二：通过音源管理后台

使用 [Koneko-API-Console](http://171.80.3.149:3004) 音源管理后台管理和分发插件。

## 插件示例

项目仓库 `ext-source-plugins/` 目录下提供了示例插件：

| 文件 | 说明 |
|------|------|
| `qs.plugin.js` | 汽水音乐扩展音源示例 |
| `bili.plugin.js` | Bilibili 扩展音源示例 |

## 加载器位置

```
src/renderer/utils/musicSdk/plugins/loader.js
```

加载器负责：
1. 读取 `window.__lxExtSourcePlugins__` 配置
2. 按顺序加载每个插件
3. 验证插件契约合规性
4. 将合规插件注册到音源系统
5. 加载失败的插件静默跳过，不影响内置音源

## 与自定义音源的区别

| 对比项 | 扩展音源插件 | 自定义音源 |
|--------|-------------|-----------|
| 目标 | 注册**新平台**音源 | 为**内置平台**换高音质直链 |
| 安装 | 动态注入（本地/远程） | 用户手动导入脚本 |
| 平台 | 由插件自行定义 | kw/kg/tx/wy/mg |
| 更新 | 更新插件即可 | 依赖音源作者维护 |
| 耦合度 | 零耦合 | 零耦合 |

## 开发建议

1. **错误处理**：所有接口应做好异常处理，避免崩溃影响主程序
2. **缓存策略**：合理缓存请求结果，减少重复网络请求
3. **版本兼容**：关注主程序 API 变动，及时更新插件
4. **开源协议**：建议遵循 Apache 2.0 或 MIT 协议
