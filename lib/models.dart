/// 站点数据模型。

/// 文档页定义。`source` 为 null 表示本仓库手写文档；`'app'` 表示
/// 运行时从应用仓库（LX-M-Music/lx-m_lx-Miao-moe-music-desktop）拉取。
class DocPage {
  final String id;
  final String title;
  final String? source;

  const DocPage(this.id, this.title, {this.source});
}

class DocSection {
  final String title;
  final List<DocPage> pages;

  const DocSection(this.title, this.pages);
}

class MirrorConfig {
  final String id;
  final String name;
  final String kind; // official | proxy
  final String testUrl;

  const MirrorConfig({
    required this.id,
    required this.name,
    required this.kind,
    required this.testUrl,
  });

  /// 把 GitHub 文件直链转换为该镜像的下载直链。
  String buildDownloadUrl(String githubUrl) {
    if (kind == 'official') return githubUrl;
    if (id == 'github.akams.cn') {
      return 'https://github.akams.cn/?url=${Uri.encodeComponent(githubUrl)}';
    }
    return 'https://$id/$githubUrl';
  }
}

enum ProbeState { pending, done, error }

class SpeedResult {
  final String mirrorId;
  final int? latency; // ms，null 表示连接失败
  final ProbeState state;

  const SpeedResult({
    required this.mirrorId,
    required this.latency,
    required this.state,
  });
}

class ReleaseAsset {
  final String name;
  final int size;
  final int downloadCount;
  final String url;

  const ReleaseAsset({
    required this.name,
    required this.size,
    required this.downloadCount,
    required this.url,
  });
}

class ReleaseInfo {
  final String tag;
  final String name;
  final DateTime publishedAt;
  final String htmlUrl;
  final String? body;
  final bool prerelease;
  final List<ReleaseAsset> assets;

  const ReleaseInfo({
    required this.tag,
    required this.name,
    required this.publishedAt,
    required this.htmlUrl,
    required this.body,
    required this.prerelease,
    required this.assets,
  });
}

String formatBytes(int bytes) {
  if (bytes == 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  final i = (bytes == 0) ? 0 : (log2(bytes) ~/ 10).clamp(0, units.length - 1);
  final value = bytes / (1 << (10 * i));
  return '${value.toStringAsFixed(value < 10 && i > 0 ? 2 : 0)} ${units[i]}';
}

int log2(num x) {
  var n = 0;
  var v = x.toInt();
  while (v > 1) {
    v >>= 1;
    n += 1;
  }
  return n;
}

String formatDate(DateTime date) {
  return '${date.year} 年 ${date.month} 月 ${date.day} 日';
}
