import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:markdown_widget/markdown_widget.dart';

import '../docs_data.dart';
import '../main.dart';
import '../models.dart';
import '../services/docs_source.dart';
import '../widgets/md.dart';

/// 文档目录页：按章节分组的卡片。
class DocsPage extends StatelessWidget {
  const DocsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '文档',
                  style: theme.textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '从安装到进阶：功能说明、故障排查与开发指南。'
                  '「上游文档」每日自动同步应用仓库，其余页面运行时热更新。',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                  ),
                ),
                const SizedBox(height: 28),
                for (final section in docSections) ...[
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        section.title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (final page in section.pages)
                        _DocCard(
                          page: page,
                          width: () {
                            final w = MediaQuery.of(context).size.width
                                .clamp(0.0, 980.0);
                            final cols = w >= 900 ? 3 : (w >= 560 ? 2 : 1);
                            return (w - (cols - 1) * 12) / cols;
                          }(),
                        ),
                    ],
                  ),
                  const SizedBox(height: 28),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DocCard extends StatelessWidget {
  final DocPage page;
  final double width;

  const _DocCard({required this.page, required this.width});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => context.go('/docs/${page.id}'),
      child: Container(
        width: width,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  page.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 6),
                if (page.source == 'app')
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '自动同步',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '/docs/${page.id}',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.35),
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 文档详情页：运行时加载 Markdown（热更新），带上一页/下一页。
class DocDetailPage extends StatefulWidget {
  final String docId;

  const DocDetailPage({super.key, required this.docId});

  @override
  State<DocDetailPage> createState() => _DocDetailPageState();
}

class _DocDetailPageState extends State<DocDetailPage> {
  late Future<String> _future;
  late DocPage _page;

  @override
  void initState() {
    super.initState();
    _page = findDocPage(widget.docId) ?? const DocPage('unknown', '未知页面');
    _future = loadDocMarkdown(_page);
  }

  @override
  void didUpdateWidget(covariant DocDetailPage old) {
    super.didUpdateWidget(old);
    if (old.docId != widget.docId) {
      _page = findDocPage(widget.docId) ?? const DocPage('unknown', '未知页面');
      _future = loadDocMarkdown(_page);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pages = allDocPages;
    final index = pages.indexWhere((p) => p.id == widget.docId);
    final prev = index > 0 ? pages[index - 1] : null;
    final next = index < pages.length - 1 ? pages[index + 1] : null;
    final isWide = MediaQuery.of(context).size.width >= 1100;

    final content = Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 860),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/docs'),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: const Text('返回文档目录'),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Text(
                    _page.title,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1,
                    ),
                  ),
                  if (_page.source == 'app') ...[
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        '每日自动同步',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _page.source == 'app'
                    ? '内容实时同步自应用仓库 master 分支，若加载失败自动回退到每日快照。'
                    : '内容运行时加载，更新文档无需重新部署站点。',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ),
              const SizedBox(height: 20),
              Divider(color: theme.colorScheme.outlineVariant),
              const SizedBox(height: 8),
              FutureBuilder<String>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 60),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  return MarkdownBlock(
                    data: snapshot.data ?? '',
                    config: markdownConfig(theme),
                  );
                },
              ),
              const SizedBox(height: 40),
              Divider(color: theme.colorScheme.outlineVariant),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (prev != null)
                    TextButton.icon(
                      onPressed: () => context.go('/docs/${prev.id}'),
                      icon: const Icon(Icons.arrow_back, size: 16),
                      label: Flexible(child: Text(prev.title)),
                    )
                  else
                    const SizedBox.shrink(),
                  if (next != null)
                    TextButton.icon(
                      onPressed: () => context.go('/docs/${next.id}'),
                      icon: const Icon(Icons.arrow_forward, size: 16),
                      label: Flexible(child: Text(next.title)),
                    )
                  else
                    const SizedBox.shrink(),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );

    if (isWide) {
      // 宽屏右侧目录占位（MarkdownWidget 自身目录能力有限，这里保留简单布局）
      return ListView(
        children: [content],
      );
    }
    return ListView(
      children: [content],
    );
  }
}
