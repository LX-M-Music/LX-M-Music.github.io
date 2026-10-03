/**
 * 首页展示数据。功能描述与应用仓库 README 保持一致。
 * icon 为 FeatureIcon 组件的键名（全站不使用 emoji 图标）。
 */

export const HERO_BADGES = [
  '扩展音源插件',
  'Cookie 同步',
  '歌曲换源',
  '插件商店',
  '高音质解锁',
];

export interface Feature {
  icon: 'plugin' | 'cookie' | 'swap' | 'audio' | 'image' | 'motion';
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'plugin',
    title: '扩展音源插件',
    description:
      '第三方平台音源以独立插件形式存在，内置插件商店一键安装官方插件。接口失效只需更新插件，主程序无需发版。',
  },
  {
    icon: 'cookie',
    title: 'Cookie 同步与歌单回传',
    description:
      '网易云、QQ、酷狗、酷我、咪咕五平台：导入自建歌单、回传本地修改、上报播放记录，播放记录 30 分钟内自动去重。',
  },
  {
    icon: 'swap',
    title: '歌曲换源',
    description:
      '按歌名、歌手与时长智能匹配候选版本，支持试听确认后跨平台原位替换，找不到匹配时可查看其他平台的搜索结果。',
  },
  {
    icon: 'audio',
    title: '自定义音源与高音质',
    description:
      '在线导入或本地导入音源脚本，支持 128k / 320k / flac / flac24bit / hires / atmos / master 七档音质，失败自动降级重试。',
  },
  {
    icon: 'image',
    title: '流动背景与封面缓存',
    description:
      '以当前歌曲专辑封面生成流动背景，按钮颜色可跟随背景动态变化；封面按需加载并写入磁盘缓存（约 256 MiB 上限）。',
  },
  {
    icon: 'motion',
    title: '无缝播放与流畅动效',
    description:
      '双 audio 引擎交叉淡化实现无缝衔接，切歌渐入渐出 100-3000ms 可调；全局平滑动画系统，速率 0.5x-1.5x 可调。',
  },
];

export type CellTone = 'yes' | 'no' | 'partial';

export interface ComparisonCell {
  tone: CellTone;
  text?: string;
}

export interface ComparisonRow {
  feature: string;
  cells: [ComparisonCell, ComparisonCell, ComparisonCell];
}

export const COMPARISON_COLUMNS = ['LX 原版', 'LX-X 移动版', 'LX-M 桌面版'];

const YES = (text?: string): ComparisonCell => ({tone: 'yes', text});
const NO: ComparisonCell = {tone: 'no'};
const PARTIAL = (text: string): ComparisonCell => ({tone: 'partial', text});

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: '扩展音源插件',
    cells: [NO, NO, YES('插件商店')],
  },
  {
    feature: 'Cookie 歌单同步与回传',
    cells: [NO, YES(), YES('5 平台')],
  },
  {
    feature: '播放记录上报',
    cells: [NO, YES(), YES('30 分钟去重')],
  },
  {
    feature: '歌曲换源',
    cells: [NO, NO, YES('跨平台匹配')],
  },
  {
    feature: '封面缓存',
    cells: [NO, NO, YES('256 MiB 上限')],
  },
  {
    feature: '高音质解锁',
    cells: [PARTIAL('自定义源'), PARTIAL('部分 Cookie'), YES('七档音质')],
  },
];
