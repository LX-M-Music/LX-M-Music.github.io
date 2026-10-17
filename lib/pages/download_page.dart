import 'package:flutter/material.dart';
import 'package:markdown_widget/markdown_widget.dart';

import '../main.dart';
import '../models.dart';
import '../services/mirrors.dart';
import '../services/releases.dart';
import '../widgets/media_backdrop.dart';
import '../widgets/md.dart';

/// 平台定义（真实命名规则匹配 Release 资产）。
class _Platform {
  final String id;
  final String name;
  final String description;
  final List<RegExp> patterns;

  const _Platform(this.id, this.name, this.description, this.patterns);
}

final _updateArtifact = RegExp(r'(?:-update\.(?:bin|json)|\.blockmap)$', caseSensitive: false);

final _platforms = <_Platform>[
  _Platform('windows', 'Windows', 'Windows 10 / 11 · x64 / x86 / ARM64', [
    RegExp(r'-win_(?:x64|x86|arm64)-(?:Setup\.exe|green\.7z)$', caseSensitive: false),
    RegExp(r'-(?:x64|x86|x86_64|arm64)-(?:Setup\.exe|portable\.exe)$', caseSensitive: false),
  ]),
  _Platform('win7', 'Windows 7 兼容版', 'Windows 7 / 8 / 8.1（x64 / x86，独立构建）', [
    RegExp(r'-win7_(?:x64|x86)-(?:Setup\.exe|green\.7z)$', caseSensitive: false),
  ]),
  _Platform('macos', 'macOS', 'macOS 10.15+ · Intel / Apple Silicon', [
    RegExp(r'\.dmg$', caseSensitive: false),
  ]),
  _Platform('linux', 'Linux', 'deb / rpm / AppImage / pacman', [
    RegExp(r'\.(?:deb|rpm|AppImage|pacman)$', caseSensitive: false),
  ]),
];

class DownloadPage extends StatefulWidget {
  const DownloadPage({super.key});

  @override
  State<DownloadPage> createState() => _DownloadPageState();
}

class _DownloadPageState extends State<DownloadPage> {
  List<MirrorConfig> _mirrors = const [];
  List<SpeedResult> _speedResults = const [];
  bool _isTesting = true;
  int _discoveredCount = 0;
  final Map<String, String> _picks = {};

  List<ReleaseInfo>? _releases;
  String? _releasesError;
  String? _selectedTag;

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _loadReleases();
  }

  Future<void> _bootstrap() async {
    // 内置清单先测速；运行时发现的节点随后并入
    final bundled = await loadBundledMirrors();
    if (!mounted) return;
    setState(() {
      _mirrors = bundled;
      _speedResults = bundled
          .map(
            (mirror) => const SpeedResult(
              mirrorId: '',
              latency: null,
              state: ProbeState.pending,
            ),
          )
          .map((_) => SpeedResult(mirrorId: '', latency: null, state: ProbeState.pending))
          .toList();
    });
    await _runSpeedTest(bundled);

    final hosts = await discoverRuntimeMirrors();
    if (!mounted) return;
    final merged = mergeDiscoveredMirrors(bundled, hosts);
    if (!identical(merged, bundled) && merged.length > bundled.length) {
      setState(() {
        _mirrors = merged;
        _discoveredCount = merged.length - bundled.length;
      });
      // 只测新发现的节点
      final fresh = merged.skip(bundled.length).toList();
      await _runSpeedTest(fresh, append: true);
    }
  }

  Future<void> _runSpeedTest(List<MirrorConfig> targets, {bool append = false}) async {
    if (targets.isEmpty) return;
    setState(() {
      _isTesting = true;
      if (!append) {
        _speedResults = targets
            .map(
              (mirror) => SpeedResult(
                mirrorId: mirror.id,
                latency: null,
                state: ProbeState.pending,
              ),
            )
            .toList();
      } else {
        _speedResults = [
          ..._speedResults,
          ...targets.map(
            (mirror) => SpeedResult(
              mirrorId: mirror.id,
              latency: null,
              state: ProbeState.pending,
            ),
          ),
        ];
      }
    });
    await probeAllMirrors(
      targets,
      onResult: (id, latency) {
        if (!mounted) return;
        setState(() {
          final index = _speedResults.indexWhere((r) => r.mirrorId == id);
          if (index >= 0) {
            _speedResults[index] = SpeedResult(
              mirrorId: id,
              latency: latency,
              state: latency == null ? ProbeState.error : ProbeState.done,
            );
          }
        });
      },
    );
    if (mounted) setState(() => _isTesting = false);
  }

  Future<void> _loadReleases() async {
    try {
      final releases = await fetchReleases();
      if (!mounted) return;
      setState(() {
        _releases = releases;
        _selectedTag = releases.first.tag;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => _releasesError = '$err');
    }
  }

  String? get _bestId => bestMirrorId(_speedResults);

  MirrorConfig? _mirrorById(String? id) {
    for (final mirror in _mirrors) {
      if (mirror.id == id) return mirror;
    }
    return _mirrors.isEmpty ? null : _mirrors.first;
  }

  String _buildDownloadUrl(ReleaseInfo release, ReleaseAsset asset) {
    final selected =
        _mirrorById(_picks[asset.name] ?? _bestId) ?? _mirrorById(null)!;
    return selected.buildDownloadUrl(
      'https://github.com/$githubOwner/$githubRepo/releases/download/${release.tag}/${Uri.encodeComponent(asset.name)}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final best = _bestId;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _HeroBand(),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1140),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 28),
                  _ReleasePanel(
                    releases: _releases,
                    error: _releasesError,
                    selectedTag: _selectedTag,
                    onSelect: (tag) {
                      if (tag != null) setState(() => _selectedTag = tag);
                    },
                  ),
                  const SizedBox(height: 16),
                  _SpeedPanel(
                    mirrors: _mirrors,
                    results: _speedResults,
                    isTesting: _isTesting,
                    bestId: best,
                    discoveredCount: _discoveredCount,
                    onRetest: () => _runSpeedTest(_mirrors),
                  ),
                  if (_releasesError != null) ...[
                    const SizedBox(height: 16),
                    _ErrorBox(error: _releasesError!),
                  ],
                  if (_releasesError == null) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 14,
                      runSpacing: 14,
                      children: [
                        for (final platform in _platforms)
                          ConstrainedBox(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width >= 1000
                                  ? 550
                                  : double.infinity,
                            ),
                            child: SizedBox(
                              width: MediaQuery.of(context).size.width >= 1000
                                  ? (MediaQuery.of(context).size.width - 48 - 28 - 24) / 2
                                  : double.infinity,
                              child: _PlatformCard(
                                platform: platform,
                                release: _releases?.firstWhere(
                                  (r) => r.tag == _selectedTag,
                                  orElse: () => _releases!.first,
                                ),
                                mirrors: _mirrors,
                                results: _speedResults,
                                bestId: best,
                                pick: _picks[platform.id],
                                onPick: (mirrorId) => setState(
                                  () => _picks[platform.id] = mirrorId,
                                ),
                                downloadUrl: _buildDownloadUrl,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 48),
                  _InstallGuide(theme: theme),
                  const SizedBox(height: 24),
                  _SafetyNotice(theme: theme),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Hero 横幅
// ---------------------------------------------------------------------------

class _HeroBand extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      height: 300,
      child: Stack(
        children: [
          Positioned.fill(
            child: MediaBackdrop(
              brightness: theme.brightness,
              rotate: true,
              sources: const [
                MediaSource.image('https://t.alcy.cc/moez'),
                MediaSource.image('https://t.alcy.cc/ycy'),
              ],
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '软件下载',
                  style: theme.textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.5,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '自动发现可用加速镜像 · 按您的网络实测 · 自动预选最快节点',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 版本面板：版本下拉 + 更新说明
// ---------------------------------------------------------------------------

class _ReleasePanel extends StatelessWidget {
  final List<ReleaseInfo>? releases;
  final String? error;
  final String? selectedTag;
  final ValueChanged<String?> onSelect;

  const _ReleasePanel({
    required this.releases,
    required this.error,
    required this.selectedTag,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = _selected(releases, selectedTag);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (releases != null)
                DropdownMenu<String>(
                  width: 300,
                  initialSelection: selectedTag,
                  requestFocusOnTap: false,
                  label: const Text('选择版本'),
                  dropdownMenuEntries: [
                    for (final (i, release) in releases!.indexed)
                      DropdownMenuEntry(
                        value: release.tag,
                        label: '${release.tag}'
                            '${i == 0 ? '（最新）' : ''}'
                            '${release.prerelease ? '（预发布）' : ''}'
                            ' · ${formatDate(release.publishedAt)}',
                      ),
                  ],
                  onSelected: onSelect,
                )
              else
                const Text('正在获取版本…'),
              if (selected != null) ...[
                if (selected.prerelease)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '预发布',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.amber.shade300,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                Text(
                  '发布于 ${formatDate(selected.publishedAt)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                  ),
                ),
                InkWell(
                  onTap: () => openInNewTab(selected.htmlUrl),
                  child: Text(
                    'Release 详情',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (selected != null) ...[
            const SizedBox(height: 14),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 340),
              child: SingleChildScrollView(
                child: MarkdownBlock(
                  data: selected.body?.isNotEmpty == true
                      ? selected.body!
                      : '本次发布没有填写更新说明。',
                  config: markdownConfig(theme),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  static ReleaseInfo? _selected(List<ReleaseInfo>? releases, String? tag) {
    if (releases == null || releases.isEmpty) return null;
    for (final release in releases) {
      if (release.tag == tag) return release;
    }
    return releases.first;
  }
}

// ---------------------------------------------------------------------------
// 镜像测速面板
// ---------------------------------------------------------------------------

class _SpeedPanel extends StatelessWidget {
  final List<MirrorConfig> mirrors;
  final List<SpeedResult> results;
  final bool isTesting;
  final String? bestId;
  final int discoveredCount;
  final VoidCallback onRetest;

  const _SpeedPanel({
    required this.mirrors,
    required this.results,
    required this.isTesting,
    required this.bestId,
    required this.discoveredCount,
    required this.onRetest,
  });

  String _badgeText(SpeedResult result) {
    if (result.state == ProbeState.pending) return '待测';
    if (result.state == ProbeState.error || result.latency == null) {
      return '不可用';
    }
    return '${result.latency}ms';
  }

  Color _badgeColor(BuildContext context, SpeedResult result) {
    final theme = Theme.of(context);
    if (result.state == ProbeState.done && result.latency != null) {
      if (result.latency! < 1500) return theme.colorScheme.primary;
      if (result.latency! < 3000) return Colors.amber.shade400;
    }
    return theme.colorScheme.onSurface.withValues(alpha: 0.4);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final done = results
        .where((r) => r.state == ProbeState.done || r.state == ProbeState.error)
        .length;

    // 展示顺序：测完按延迟升序，失败与待测靠后
    final sorted = isTesting
        ? results
        : [...results]..sort((a, b) {
            int rank(SpeedResult r) {
              if (r.state == ProbeState.done && r.latency != null) {
                return r.latency!;
              }
              return r.state == ProbeState.error ? 1 << 30 : 1 << 31;
            }

            return rank(a) - rank(b);
          });

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 10,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 620),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '镜像测速',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '由您的浏览器基于本机网络实时探测，结果因地区与运营商而异；测速完成后自动预选最快节点，也可以在下方卡片中手动切换。'
                      '${discoveredCount > 0 ? ' 本页已实时发现 $discoveredCount 个新节点，内置清单每日自动刷新。' : ' 内置清单每日自动刷新。'}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isTesting ? '已测 $done/${mirrors.length}' : '共 ${mirrors.length} 个节点',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton.tonal(
                    onPressed: isTesting ? null : onRetest,
                    child: Text(isTesting ? '测速中…' : '重新测速'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 380),
            child: SingleChildScrollView(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final result in sorted)
                    _MirrorChip(
                      result: result,
                      text: _badgeText(result),
                      color: _badgeColor(context, result),
                      isBest: !isTesting && bestId == result.mirrorId,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MirrorChip extends StatelessWidget {
  final SpeedResult result;
  final String text;
  final Color color;
  final bool isBest;

  const _MirrorChip({
    required this.result,
    required this.text,
    required this.color,
    required this.isBest,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: isBest
            ? theme.colorScheme.primary.withValues(alpha: 0.12)
            : theme.colorScheme.onSurface.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(
          color: isBest
              ? theme.colorScheme.primary.withValues(alpha: 0.55)
              : theme.colorScheme.outlineVariant,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isBest) ...[
            Icon(Icons.emoji_events_outlined, size: 13, color: theme.colorScheme.primary),
            const SizedBox(width: 5),
          ],
          Text(
            result.mirrorId,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(width: 7),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1.5),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              text,
              style: theme.textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 平台卡片
// ---------------------------------------------------------------------------

class _PlatformCard extends StatelessWidget {
  final _Platform platform;
  final ReleaseInfo? release;
  final List<MirrorConfig> mirrors;
  final List<SpeedResult> results;
  final String? bestId;
  final String? pick;
  final ValueChanged<String> onPick;
  final String Function(ReleaseInfo, ReleaseAsset) downloadUrl;

  const _PlatformCard({
    required this.platform,
    required this.release,
    required this.mirrors,
    required this.results,
    required this.bestId,
    required this.pick,
    required this.onPick,
    required this.downloadUrl,
  });

  List<ReleaseAsset> _assets(ReleaseInfo release) {
    final items = release.assets
        .where((asset) => !_updateArtifact.hasMatch(asset.name))
        .where(
          (asset) => platform.patterns.any((p) => p.hasMatch(asset.name)),
        )
        .toList()
      ..sort((a, b) => _rank(a.name) - _rank(b.name));
    return items;
  }

  static int _rank(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('setup.exe')) return 0;
    if (lower.endsWith('portable.exe')) return 1;
    if (lower.endsWith('green.7z')) return 2;
    return 3;
  }

  String _mirrorLabel(MirrorConfig mirror) {
    for (final result in results) {
      if (result.mirrorId == mirror.id) {
        if (result.state == ProbeState.done && result.latency != null) {
          return '${mirror.name}（${result.latency}ms）';
        }
        if (result.state == ProbeState.error) return '${mirror.name}（不可用）';
      }
    }
    return mirror.name;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectivePick = pick ?? bestId ?? 'github';
    final selectedMirror = mirrors
        .where((m) => m.id == effectivePick)
        .fold<MirrorConfig?>(null, (prev, m) => m) ??
        (mirrors.isNotEmpty ? mirrors.first : null);

    final assets = release == null ? null : _assets(release!);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.asset(
                  'assets/img/app-icon-256.png',
                  width: 40,
                  height: 40,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      platform.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      platform.description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Row(
              children: [
                Text(
                  '下载镜像',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButton<String>(
                    value: selectedMirror?.id,
                    isExpanded: true,
                    isDense: true,
                    underline: const SizedBox.shrink(),
                    borderRadius: BorderRadius.circular(12),
                    items: [
                      for (final mirror in mirrors)
                        DropdownMenuItem(
                          value: mirror.id,
                          child: Text(
                            _mirrorLabel(mirror),
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall,
                          ),
                        ),
                    ],
                    onChanged: (id) {
                      if (id != null) onPick(id);
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (release == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Center(child: Text('正在获取版本信息…')),
            )
          else if (assets!.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 18),
              child: Center(
                child: Text(
                  '暂无该平台安装包，可关注后续 Release',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
            )
          else
            ...[
              for (final asset in assets)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: theme.colorScheme.outlineVariant,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                asset.name,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'monospace',
                                ),
                              ),
                              Text(
                                '${formatBytes(asset.size)} · ${asset.downloadCount} 次下载',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.onSurface
                                      .withValues(alpha: 0.45),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        FilledButton(
                          onPressed: () =>
                              openInNewTab(downloadUrl(release!, asset)),
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('下载'),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 错误 / 安装说明 / 安全提示
// ---------------------------------------------------------------------------

class _ErrorBox extends StatelessWidget {
  final String error;

  const _ErrorBox({required this.error});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            '获取版本信息失败：$error',
            style: theme.textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            '您可以尝试直接访问 GitHub Release 页面下载',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: () => openInNewTab(releasesUrl),
            child: const Text('前往 GitHub Release'),
          ),
        ],
      ),
    );
  }
}

class _InstallGuide extends StatelessWidget {
  final ThemeData theme;

  const _InstallGuide({required this.theme});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '安装说明',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 14,
          runSpacing: 14,
          children: [
            _guideCard(
              context,
              'Windows',
              [
                ('Setup.exe', '标准安装版，支持自动更新'),
                ('portable.exe', '便携版，单文件免安装'),
                ('green.7z', '绿色版，解压即用'),
                ('x64 / x86 / arm64', '64 位、32 位与 ARM 架构'),
                ('win7_ 前缀', 'Windows 7/8/8.1 兼容版（基于 Electron 22）'),
              ],
            ),
            _guideCard(
              context,
              'macOS',
              [
                ('.dmg', '通用安装包，拖入 Applications 即可'),
                ('x64 / arm64', 'Intel 芯片与 Apple Silicon（M 系列）'),
              ],
              note: '当前版本暂未提供 macOS 安装包，可关注后续 Release',
            ),
            _guideCard(
              context,
              'Linux',
              [
                ('.deb', 'Debian / Ubuntu 系'),
                ('.rpm', 'Fedora / RHEL 系'),
                ('.AppImage', '通用格式，无需安装'),
                ('.pacman', 'Arch Linux 系'),
              ],
              note: '当前版本暂未提供 Linux 安装包，可关注后续 Release',
            ),
          ],
        ),
      ],
    );
  }

  Widget _guideCard(
    BuildContext context,
    String title,
    List<(String, String)> items, {
    String? note,
  }) {
    final theme = Theme.of(context);
    final width = MediaQuery.of(context).size.width;
    final cardWidth = width >= 1000
        ? (width.clamp(0, 1140) - 28) / 3
        : (width >= 640 ? (width - 38) / 2 : width - 48);
    return Container(
      width: cardWidth,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          for (final (label, description) in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 7),
              child: RichText(
                text: TextSpan(
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                    height: 1.5,
                  ),
                  children: [
                    TextSpan(
                      text: label,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(text: '：$description'),
                  ],
                ),
              ),
            ),
          if (note != null) ...[
            const SizedBox(height: 4),
            Text(
              note,
              style: theme.textTheme.labelSmall?.copyWith(
                color: Colors.amber.shade400,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SafetyNotice extends StatelessWidget {
  final ThemeData theme;

  const _SafetyNotice({required this.theme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '安全提示',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: Colors.amber.shade300,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '如果杀毒软件报毒，请先确认软件是从本页面或 GitHub Release 下载的。确认为官方渠道下载后，大概率是误报；'
            '加速镜像仅代理官方 Release 文件，下载后可比对 Release 页中的 SHA-256 校验值。'
            '我们不对第三方渠道下载的安全性作任何保证。',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              height: 1.65,
            ),
          ),
        ],
      ),
    );
  }
}
