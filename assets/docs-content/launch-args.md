# 启动参数

目前支持的启动参数：

| 参数 | 说明 |
| --- | --- |
| `-search` | 启动时自动搜索指定内容，例：`-search="突然的自我 - 伍佰"` |
| `-dha` | 禁用硬件加速（窗口显示有问题时尝试，v1.6.0+） |
| `-dt` | 以非透明模式启动（未开启 Aero 的 Win7 使用） |
| `-dhmkh` | 禁用硬件媒体密钥处理 |
| `-proxy-server` | 设置代理服务器代理全部流量，例：`-proxy-server="127.0.0.1:1081"`（不支持账号密码）。应用内「设置-网络-代理设置」仅代理接口请求且优先级更高 |
| `-proxy-bypass-list` | 分号分隔的主机列表绕过代理，例：`-proxy-bypass-list="<local>;*.google.com"`（与 `-proxy-server` 一起使用） |
| `-play` | 启动时播放指定列表，例：`-play="type=songList&source=kw&link=歌单URL or ID"`；`source` 可用 `kw/kg/tx/wy/mg/myList`，`myList` 用 `name` 指定列表名，可选 `index` 指定起始位置 |

添加方法：给快捷方式加参数（自行检索）。
