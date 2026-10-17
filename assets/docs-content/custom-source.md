# 自定义音源与音质

**播放前需配置可用的自定义源。** 平台接口提供搜索、歌单和歌词，播放与下载使用音源返回的音频地址。

## 导入音源

1. 打开「设置 → 基本设置 → 自定义源管理」
2. 导入本地 JavaScript 脚本，或通过「在线导入」填写地址；本地脚本支持批量导入
3. 在基本设置中选中已导入的音源
4. 在「设置 → 播放设置 → 优先播放的音质」中选择音质
5. 使用基本设置中的「音源音质检测」检查各平台的音质请求结果

## 支持的音质

`128k` · `320k` · `flac` · `flac24bit` · `hires` · `atmos` · `master`

| 行为 | 说明 |
| --- | --- |
| 品质与标记 | 下载品质、列表标记结合音源声明及歌曲信息显示 |
| 降级重试 | 高音质获取或播放失败时，尝试可用的较低音质 |
| 可用范围 | 由自定义源和音频资源决定；**Cookie 同步不提供高音质解锁** |
| 检测范围 | 检查样本歌曲是否返回音频地址，不代表所有歌曲均可播放 |

## 音源脚本编写说明

文件请使用 **UTF-8** 编码，语言为 JavaScript（ES6+），通过事件收发与应用交互。

脚本文件开头必须包含注释头：

```js
/**
 * @name 测试音乐源
 * @description 我只是一个测试音乐源哦
 * @version 1.0.0
 * @author xxx
 * @homepage http://xxx
 */
```

### 最小可用示例

```js
const { EVENT_NAMES, request, on, send } = window.lx

const qualitys = {
  kw: { '128k': '128', '320k': '320', flac: 'flac' },
}

on(EVENT_NAMES.request, ({ source, action, info }) => {
  // action 为 musicUrl 时需要返回 Promise，resolve 歌曲播放地址
  switch (action) {
    case 'musicUrl':
      return Promise.resolve('https://example.com/audio.mp3')
  }
})

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: false,
  sources: {
    kw: {
      name: '酷我音乐',
      type: 'music',
      actions: ['musicUrl'],
      qualitys: ['128k', '320k', 'flac'],
    },
  },
})
```

### `window.lx` API

| 成员 | 说明 |
| --- | --- |
| `window.lx.version` | 自定义源 API 版本 |
| `window.lx.EVENT_NAMES` | 事件常量：`inited` / `request` / `updateAlert` |
| `window.lx.on(name, handler)` | 注册应用请求事件，回调必须返回 Promise |
| `window.lx.send(name, data)` | 发送事件给应用（如初始化完成、源更新提示） |
| `window.lx.request(url, options, cb)` | HTTP 请求（不受跨域限制），返回取消函数 |
| `window.lx.utils.crypto.*` | aesEncrypt / md5 / randomBytes / rsaEncrypt |
| `window.lx.utils.buffer.*` | Buffer.from / bufToString |

`request` 事件的 `info` 结构：`{type, musicInfo}`，`type` 为音质名，`musicInfo` 为音乐信息对象（含歌曲 ID、名字、hash 等）。

### 更新提示

脚本可发送 `updateAlert` 事件（每次运行只能调用一次）：

```js
lx.send(lx.EVENT_NAMES.updateAlert, { log: '更新内容...', updateUrl: 'https://...' })
```

完整说明可参考上游文档 [自定义源脚本编写](https://lyswhut.github.io/lx-music-doc/desktop/custom-source-script)。
