import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models.dart';
import 'mirrors.dart' show githubOwner, githubRepo;

/// 拉取最近发布（含旧版本），按发布时间倒序。
Future<List<ReleaseInfo>> fetchReleases({int perPage = 10}) async {
  final res = await http
      .get(
        Uri.parse(
          'https://api.github.com/repos/$githubOwner/$githubRepo/releases?per_page=$perPage',
        ),
        headers: {
          'accept': 'application/vnd.github+json',
          'user-agent': 'lx-m-doc',
        },
      )
      .timeout(const Duration(seconds: 20));

  if (res.statusCode == 403) {
    throw Exception('GitHub API 请求次数已达上限，请稍后重试');
  }
  if (res.statusCode != 200) {
    throw Exception('GitHub API 返回 HTTP ${res.statusCode}');
  }

  final list = jsonDecode(utf8.decode(res.bodyBytes)) as List<dynamic>;
  return list.map(_parseRelease).toList();
}

ReleaseInfo _parseRelease(dynamic item) {
  final map = item as Map<String, dynamic>;
  return ReleaseInfo(
    tag: map['tag_name'] as String? ?? '',
    name: map['name'] as String? ?? '',
    publishedAt:
        DateTime.tryParse(map['published_at'] as String? ?? '') ??
            DateTime.now(),
    htmlUrl: map['html_url'] as String? ?? '',
    body: map['body'] as String?,
    prerelease: map['prerelease'] as bool? ?? false,
    assets: (map['assets'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(
          (asset) => ReleaseAsset(
            name: asset['name'] as String? ?? '',
            size: (asset['size'] as num?)?.toInt() ?? 0,
            downloadCount: (asset['download_count'] as num?)?.toInt() ?? 0,
            url: asset['browser_download_url'] as String? ?? '',
          ),
        )
        .toList(),
  );
}

/// 把 Release 更新说明（Markdown）渲染为 HTML 交给 web 视图。
/// 这里不引入 Dart 端 Markdown 解析器：说明内容来自官方发布页，
/// 仅做最基础的净化后使用浏览器渲染，由 Flutter 侧容器约束样式。
String sanitizeReleaseBody(String? body) {
  if (body == null || body.isEmpty) {
    return '<p>本次发布没有填写更新说明。</p>';
  }
  return body
      .replaceAll(RegExp(r'<script[\s\S]*?</script>', caseSensitive: false), '')
      .replaceAll(RegExp(r'<iframe[\s\S]*?</iframe>', caseSensitive: false), '')
      .replaceAll(RegExp(r'\son\w+="[^"]*"', caseSensitive: false), '')
      .replaceAll('\r\n', '\n');
}

/// 把 Markdown 转为简单 HTML 列表摘要（用于版本选择浮层）。
List<String> extractNoteHeadlines(String? body) {
  if (body == null) return const [];
  return body
      .split('\n')
      .map((line) => line.trim())
      .where((line) => line.startsWith('- ') || line.startsWith('* '))
      .take(8)
      .map((line) => line.substring(2).replaceAll(RegExp(r'[*`]'), ''))
      .toList();
}
