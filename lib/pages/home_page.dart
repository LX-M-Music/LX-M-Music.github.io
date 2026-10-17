import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../main.dart';
import '../widgets/media_backdrop.dart';
import '../widgets/typewriter.dart';

const _typingPhrases = [
  '扩展音源插件机制',
  '五平台 Cookie 同步',
  '歌曲智能换源',
  '七档音质解锁',
  '无缝衔接播放',
  '内置插件商店',
];

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        _Hero(),
        _Features(),
        _Comparison(),
        _CTA(),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isWide = MediaQuery.of(context).size.width >= 900;
    final isDark = theme.brightness == Brightness.dark;

    return Stack(
      children: [
        SizedBox(
          height: isWide ? 620 : 560,
          child: MediaBackdrop(
            brightness: theme.brightness,
            sources: const [
              MediaSource.video('https://t.alcy.cc/acg'),
              MediaSource.image('https://t.alcy.cc/moez'),
              MediaSource.image('https://t.alcy.cc/ycy'),
            ],
          ),
        ),
        SizedBox(
          height: isWide ? 620 : 560,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1140),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: isWide
                    ? Row(
                        children: [
                          Expanded(
                            flex: 6,
                            child: _HeroText(isDark: isDark),
                          ),
                          const Expanded(flex: 4, child: _HeroIconCard()),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const _HeroIconCard(compact: true),
                          const SizedBox(height: 24),
                          _HeroText(isDark: isDark, center: true),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _HeroText extends StatelessWidget {
  final bool isDark;
  final bool center;

  const _HeroText({required this.isDark, this.center = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final alignment = center ? CrossAxisAlignment.center : CrossAxisAlignment.start;

    return Column(
      crossAxisAlignment: alignment,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(
              color: theme.colorScheme.primary.withValues(alpha: 0.3),
            ),
          ),
          child: Text(
            '开源 · 免费 · 桌面端',
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.06,
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'LX-M Music',
          textAlign: center ? TextAlign.center : TextAlign.left,
          style: theme.textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 56,
            letterSpacing: -2,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        // 打字机：逐字打出核心特性
        Typewriter(
          phrases: _typingPhrases,
          style: theme.textTheme.titleLarge?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          '基于 LX Music 原版深度增强：多平台音乐搜索 · 本地歌单管理 · 桌面歌词 · 音效与可视化',
          textAlign: center ? TextAlign.center : TextAlign.left,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.75),
            height: 1.6,
          ),
        ),
        const SizedBox(height: 22),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: center ? WrapAlignment.center : WrapAlignment.start,
          children: [
            '扩展音源插件',
            'Cookie 同步',
            '歌曲换源',
            '插件商店',
            '高音质解锁',
          ]
              .map(
                (badge) => Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(
                      color: theme.colorScheme.outlineVariant,
                    ),
                  ),
                  child: Text(
                    badge,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 28),
        Wrap(
          spacing: 12,
          runSpacing: 10,
          alignment: center ? WrapAlignment.center : WrapAlignment.start,
          children: [
            FilledButton.icon(
              onPressed: () => context.go('/docs'),
              icon: const Icon(Icons.menu_book_outlined, size: 18),
              label: const Text('阅读文档'),
            ),
            FilledButton.tonalIcon(
              onPressed: () => context.go('/download'),
              icon: const Icon(Icons.download_outlined, size: 18),
              label: const Text('立即下载'),
            ),
            OutlinedButton.icon(
              onPressed: () => openInNewTab(
                'https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop',
              ),
              icon: const Icon(Icons.star_outline, size: 18),
              label: const Text('GitHub'),
            ),
          ],
        ),
      ],
    );
  }
}

class _HeroIconCard extends StatelessWidget {
  final bool compact;

  const _HeroIconCard({this.compact = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = compact ? 116.0 : 168.0;
    return Center(
      child: Container(
        padding: EdgeInsets.all(compact ? 16 : 26),
        decoration: BoxDecoration(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(compact ? 30 : 40),
          border: Border.all(color: theme.colorScheme.outlineVariant),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(compact ? 24 : 34),
              child: Image.asset(
                'assets/img/app-icon-512.png',
                width: size,
                height: size,
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 14),
              Text(
                'LX-M Music 桌面版',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 特性
// ---------------------------------------------------------------------------

class _Feature {
  final IconData icon;
  final String title;
  final String description;

  const _Feature(this.icon, this.title, this.description);
}

const _features = <_Feature>[
  _Feature(Icons.extension_outlined, '扩展音源插件',
      '第三方音源以独立插件形式存在，内置插件商店一键安装官方插件。接口失效只需更新插件，主程序无需发版。'),
  _Feature(Icons.cookie_outlined, 'Cookie 同步与歌单回传',
      '网易云、QQ、酷狗、酷我、咪咕五平台：导入自建歌单、回传本地修改、上报播放记录，播放记录 30 分钟内自动去重。'),
  _Feature(Icons.swap_horiz, '歌曲换源',
      '按歌名、歌手与时长智能匹配候选版本，试听确认后跨平台原位替换，找不到匹配时可查看其他平台的搜索结果。'),
  _Feature(Icons.graphic_eq, '自定义音源与高音质',
      '在线导入或本地导入音源脚本，支持 128k / 320k / flac / flac24bit / hires / atmos / master 七档音质，失败自动降级重试。'),
  _Feature(Icons.wallpaper_outlined, '流动背景与封面缓存',
      '以当前歌曲专辑封面生成流动背景，按钮颜色可跟随背景变化；封面按需加载并写入磁盘缓存（约 256 MiB 上限）。'),
  _Feature(Icons.bolt_outlined, '无缝播放与流畅动效',
      '双 audio 引擎交叉淡化实现无缝衔接，切歌渐入渐出 100-3000ms 可调；全局平滑动画系统，速率 0.5x-1.5x 可调。'),
];

class _Features extends StatelessWidget {
  const _Features();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final width = MediaQuery.of(context).size.width;
    final crossAxisCount = width >= 1000 ? 3 : (width >= 640 ? 2 : 1);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 72, horizontal: 24),
      color: theme.scaffoldBackgroundColor,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1140),
          child: Column(
            children: [
              _SectionHeader(
                title: '核心特性',
                subtitle: '在 LX Music 原版基础上，新增多项增强功能',
              ),
              const SizedBox(height: 36),
              LayoutBuilder(
                builder: (context, constraints) {
                  final itemWidth =
                      (constraints.maxWidth - (crossAxisCount - 1) * 14) /
                          crossAxisCount;
                  return Wrap(
                    spacing: 14,
                    runSpacing: 14,
                    children: [
                      for (final feature in _features)
                        SizedBox(
                          width: itemWidth,
                          child: _FeatureCard(feature: feature),
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _SectionHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(
          title,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
          ),
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final _Feature feature;

  const _FeatureCard({required this.feature});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 190,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Icon(feature.icon, color: theme.colorScheme.primary, size: 22),
          ),
          const SizedBox(height: 14),
          Text(
            feature.title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: Text(
              feature.description,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                height: 1.55,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 版本对比
// ---------------------------------------------------------------------------

class _Row {
  final String feature;
  final List<_Cell> cells;

  const _Row(this.feature, this.cells);
}

enum _Tone { yes, no, partial }

class _Cell {
  final _Tone tone;
  final String? text;

  const _Cell.yes([this.text]) : tone = _Tone.yes;
  const _Cell.no() : tone = _Tone.no, text = null;
  const _Cell.partial(this.text) : tone = _Tone.partial;
}

const _columns = ['LX 原版', 'LX-X 移动版', 'LX-M 桌面版'];

const _rows = <_Row>[
  _Row('扩展音源插件', [_Cell.no(), _Cell.no(), _Cell.yes('插件商店')]),
  _Row('Cookie 歌单同步与回传', [_Cell.no(), _Cell.yes(), _Cell.yes('5 平台')]),
  _Row('播放记录上报', [_Cell.no(), _Cell.yes(), _Cell.yes('30 分钟去重')]),
  _Row('歌曲换源', [_Cell.no(), _Cell.no(), _Cell.yes('跨平台匹配')]),
  _Row('封面缓存', [_Cell.no(), _Cell.no(), _Cell.yes('256 MiB 上限')]),
  _Row('高音质解锁', [_Cell.partial('自定义源'), _Cell.partial('部分 Cookie'), _Cell.yes('七档音质')]),
];

class _Comparison extends StatelessWidget {
  const _Comparison();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 72, horizontal: 24),
      color: theme.brightness == Brightness.dark
          ? const Color(0xFF121926)
          : const Color(0xFFF0F3F6),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 980),
          child: Column(
            children: [
              _SectionHeader(title: '版本对比', subtitle: 'LX-M 与原版、移动版的差异'),
              const SizedBox(height: 36),
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                clipBehavior: Clip.antiAlias,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingRowColor: WidgetStatePropertyAll(
                      theme.colorScheme.onSurface.withValues(alpha: 0.04),
                    ),
                    columns: [
                      DataColumn(
                        label: Text(
                          '特性',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      for (final (i, column) in _columns.indexed)
                        DataColumn(
                          label: Text(
                            column,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: i == 2 ? theme.colorScheme.primary : null,
                            ),
                          ),
                        ),
                    ],
                    rows: [
                      for (final row in _rows)
                        DataRow(
                          cells: [
                            DataCell(
                              Text(
                                row.feature,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            for (final cell in row.cells)
                              DataCell(
                                Text(
                                  switch (cell.tone) {
                                    _Tone.yes => cell.text ?? '支持',
                                    _Tone.no => '—',
                                    _Tone.partial => '部分 · ${cell.text}',
                                  },
                                  style: TextStyle(
                                    fontWeight: cell.tone == _Tone.no
                                        ? FontWeight.w400
                                        : FontWeight.w600,
                                    color: switch (cell.tone) {
                                      _Tone.yes => theme.colorScheme.primary,
                                      _Tone.no => theme.colorScheme.onSurface
                                          .withValues(alpha: 0.35),
                                      _Tone.partial => theme
                                          .colorScheme.secondary
                                          .withValues(alpha: 0.9),
                                    },
                                  ),
                                ),
                              ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

class _CTA extends StatelessWidget {
  const _CTA();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 72, horizontal: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 720),
          padding: const EdgeInsets.all(44),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: theme.colorScheme.primary.withValues(alpha: 0.28),
            ),
          ),
          child: Column(
            children: [
              Text(
                '准备好开始了吗？',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '下载 LX-M Music，体验扩展音源插件与 Cookie 同步带来的全新音乐体验。',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                ),
              ),
              const SizedBox(height: 26),
              Wrap(
                spacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  FilledButton.icon(
                    onPressed: () => context.go('/download'),
                    icon: const Icon(Icons.download_outlined, size: 18),
                    label: const Text('下载软件'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/docs'),
                    icon: const Icon(Icons.menu_book_outlined, size: 18),
                    label: const Text('查看文档'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
