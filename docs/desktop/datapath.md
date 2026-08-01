---
sidebar_position: 6
---

# 数据存储路径

LX-M Music 的数据存储位置与原版 LX Music 一致。

## 各平台数据路径

### Windows

```
%APPDATA%\lx-music-desktop
# 或
C:\Users\<用户名>\AppData\Roaming\lx-music-desktop
```

### macOS

```
~/Library/Application Support/lx-music-desktop
```

### Linux

```
~/.config/lx-music-desktop
# 或
$XDG_CONFIG_HOME/lx-music-desktop
```

## 目录结构

```
lx-music-desktop/
├── config.json          # 软件配置（含 Cookie、音源设置等）
├── config_v2.json       # 新版配置格式
├── player.log           # 播放器日志
├── error.log            # 错误日志
├── data/
│   └── ...              # 其他数据文件
└── ...
```

## 备份与迁移

### 备份配置

直接复制上述数据目录即可完整备份所有设置和 Cookie。

### 迁移到新设备

1. 在原设备上复制数据目录
2. 在新设备安装 LX-M Music
3. 关闭软件，将备份数据覆盖到新设备对应路径
4. 启动软件，所有设置和 Cookie 将自动恢复

## 注意事项

- 请勿在软件运行时直接修改配置文件，可能导致数据损坏
- 建议定期备份 `config.json`，防止意外丢失 Cookie 和音源配置
- 卸载软件时数据目录不会自动删除，如需彻底清理请手动删除
