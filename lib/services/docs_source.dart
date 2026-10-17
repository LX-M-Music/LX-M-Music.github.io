import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;

import '../models.dart';

/// 文档内容来源（热更新）：
///  1. 本仓库手写文档 → 运行时从 GitHub raw / jsDelivr / 加速镜像拉取；
///  2. 上游文档（readme / faq / changelog 等）→ 从应用仓库拉取；
///  3. 全部链路失败时回退到打包内置的快照（每日定时任务刷新）。

const _docSiteRepo = 'LX-M-Music/LX-M-Music.github.io';
const _docSiteBranch = 'main';
const _appRepo = 'LX-M-Music/lx-m_lx-Miao-moe-music-desktop';
const _appBranch = 'master';

Uri _githubRaw(String repo, String branch, String path, {bool viaProxy = false}) {
  final raw = 'https://raw.githubusercontent.com/$repo/$branch/$path';
  return Uri.parse(viaProxy ? 'https://ghfast.top/$raw' : raw);
}

Uri _jsDelivr(String repo, String branch, String path) =>
    Uri.parse('https://cdn.jsdelivr.net/gh/$repo@$branch/$path');

Future<String?> _fetchText(Uri uri) async {
  try {
    final bust = DateTime.now().millisecondsSinceEpoch.toString();
    final res = await http
        .get(
          uri.replace(queryParameters: {...uri.queryParameters, 't': bust}),
          headers: {'user-agent': 'lx-m-doc'},
        )
        .timeout(const Duration(seconds: 12));
    if (res.statusCode == 200 && res.bodyBytes.isNotEmpty) {
      final body = String.fromCharCodes(res.bodyBytes);
      // jsDelivr 对不存在的文件可能返回错误文案而非 404
      if (!body.startsWith("Couldn't find") &&
          !body.startsWith('Package size exceeded')) {
        return body;
      }
    }
  } catch (_) {
    // 链路失败，继续下一个
  }
  return null;
}

/// 加载文档 Markdown。
/// [page.source] == 'app' 时从应用仓库读取；否则从文档站仓库读取。
Future<String> loadDocMarkdown(DocPage page) async {
  final isUpstream = page.source == 'app';
  final repo = isUpstream ? _appRepo : _docSiteRepo;
  final branch = isUpstream ? _appBranch : _docSiteBranch;
  final path = isUpstream ? _upstreamPath(page.id) : 'docs-content/${page.id}.md';

  // 直连 raw（内容最新）→ jsDelivr（国内友好）→ ghfast 加速镜像
  final candidates = <Uri>[
    _githubRaw(repo, branch, path),
    _jsDelivr(repo, branch, path),
    _githubRaw(repo, branch, path, viaProxy: true),
  ];
  for (final uri in candidates) {
    final body = await _fetchText(uri);
    if (body != null) return body;
  }

  // 打包内置快照兜底
  final assetPath = isUpstream
      ? 'assets/docs-upstream/${page.id}.md'
      : 'assets/docs-content/${page.id}.md';
  try {
    return await rootBundle.loadString(assetPath);
  } catch (_) {
    return '# 暂时无法加载\n\n该文档暂时无法加载，请检查网络后重试。';
  }
}

/// 上游文档 id → 应用仓库内路径。
String _upstreamPath(String id) {
  switch (id) {
    case 'upstream-readme':
      return 'README.md';
    case 'upstream-faq':
      return 'FAQ.md';
    case 'upstream-changelog':
      return 'CHANGELOG.md';
    case 'upstream-win7':
      return 'doc/win7-compatibility.md';
    default:
      return '$id.md';
  }
}
