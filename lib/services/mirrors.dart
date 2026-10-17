import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:web/web.dart' as web;

import '../models.dart';

@JS('fetch')
external JSPromise<JSAny?> _jsFetch(JSString url, JSObject init);

const githubOwner = 'LX-M-Music';
const githubRepo = 'lx-m_lx-Miao-moe-music-desktop';
const releasesUrl = 'https://github.com/$githubOwner/$githubRepo/releases';

/// 内置镜像清单（种子 + 每日定时任务从聚合站爬取刷新）。
Future<List<MirrorConfig>> loadBundledMirrors() async {
  final raw = await rootBundle.loadString('assets/data/mirrors.json');
  final hosts = (jsonDecode(raw) as List<dynamic>).cast<String>();
  final mirrors = <MirrorConfig>[
    const MirrorConfig(
      id: 'github',
      name: 'GitHub 官方',
      kind: 'official',
      testUrl: 'https://github.com/',
    ),
    const MirrorConfig(
      id: 'github.akams.cn',
      name: 'Akams 加速',
      kind: 'proxy',
      testUrl: 'https://github.akams.cn/',
    ),
  ];
  for (final host in hosts) {
    if (host == 'github.akams.cn') continue;
    mirrors.add(
      MirrorConfig(
        id: host,
        name: host,
        kind: 'proxy',
        testUrl: 'https://$host/',
      ),
    );
  }
  return mirrors;
}

/// 访客侧单镜像测速：no-cors HEAD，网络失败（DNS/超时）返回 null。
/// 与浏览器端 fetch 语义一致，能区分“可达但 4xx”与“完全不可达”。
Future<int?> probeMirror(MirrorConfig mirror, {int timeoutMs = 5000}) async {
  final init = JSObject();
  init.setProperty('method'.toJS, 'HEAD'.toJS);
  init.setProperty('mode'.toJS, 'no-cors'.toJS);
  init.setProperty('cache'.toJS, 'no-store'.toJS);
  final controller = web.AbortController();
  init.setProperty('signal'.toJS, controller.signal.jsify()!);

  final startedAt = DateTime.now();
  final timer = Timer(Duration(milliseconds: timeoutMs), () => controller.abort());
  try {
    await _jsFetch(
      mirror.testUrl.toJS,
      init,
    ).toDart;
    return DateTime.now().difference(startedAt).inMilliseconds;
  } catch (_) {
    return null;
  } finally {
    timer.cancel();
  }
}

/// 并发测速（工作池），每完成一个回调一次。
Future<void> probeAllMirrors(
  List<MirrorConfig> mirrors, {
  int concurrency = 8,
  int timeoutMs = 5000,
  required void Function(String id, int? latency) onResult,
}) async {
  var next = 0;
  Future<void> worker() async {
    while (next < mirrors.length) {
      final mirror = mirrors[next++];
      final latency = await probeMirror(mirror, timeoutMs: timeoutMs);
      onResult(mirror.id, latency);
    }
  }

  await Future.wait(
    List.generate(mirrors.length.clamp(0, concurrency), (_) => worker()),
  );
}

/// 取延迟最低的可用镜像。
String? bestMirrorId(List<SpeedResult> results) {
  SpeedResult? best;
  for (final result in results) {
    if (result.state != ProbeState.done || result.latency == null) continue;
    if (best == null || (best.latency ?? 1 << 31) > result.latency!) {
      best = result;
    }
  }
  return best?.mirrorId;
}

// ---------------------------------------------------------------------------
// 运行时镜像发现：经公共 CORS 代理抓取聚合站（moretools / akams）。
// ---------------------------------------------------------------------------

final _corsProxies = <String Function(String)>[
  (url) => 'https://api.allorigins.win/raw?url=${Uri.encodeComponent(url)}',
  (url) => 'https://corsproxy.io/?url=${Uri.encodeComponent(url)}',
  (url) => 'https://api.codetabs.com/v1/proxy?quest=${Uri.encodeComponent(url)}',
];

Future<String?> _fetchViaProxies(String url, {int timeoutMs = 10000}) async {
  for (final wrap in _corsProxies) {
    try {
      final res = await http
          .get(
            Uri.parse(wrap(url)),
            headers: {'accept': 'text/html,application/json,*/*'},
          )
          .timeout(Duration(milliseconds: timeoutMs));
      if (res.statusCode == 200) return res.body;
    } catch (_) {
      // 尝试下一个代理
    }
  }
  return null;
}

final _hostPattern = RegExp(
  r'^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$',
);

List<String> _extractMoretoolsHosts(String html) {
  final hosts = <String>{};
  final spanRe = RegExp(
    r'<span class="min-w-0 break-all font-mono text-sm text-foreground">(https?://[^<]+?)</span>',
  );
  for (final m in spanRe.allMatches(html)) {
    try {
      hosts.add(Uri.parse(m.group(1)!).host.toLowerCase());
    } catch (_) {}
  }
  if (hosts.isEmpty) {
    final generic = RegExp(
      r'https?://([a-z0-9][a-z0-9.-]*\.[a-z]{2,})/',
      caseSensitive: false,
    );
    for (final m in generic.allMatches(html)) {
      final host = m.group(1)!.toLowerCase();
      if (!host.contains('moretools') && !host.contains('google')) {
        hosts.add(host);
      }
    }
  }
  return hosts.toList();
}

final _akamsValue = RegExp(r'value:"([a-z0-9.-]+\.[a-z]{2,})"', caseSensitive: false);

List<String> _extractAkamsHosts(String js) =>
    _akamsValue.allMatches(js).map((m) => m.group(1)!.toLowerCase()).toList();

/// 运行时发现新的加速节点（不含种子节点）。
Future<List<String>> discoverRuntimeMirrors({int timeoutMs = 12000}) async {
  final hosts = <String>{};

  final moretools = await _fetchViaProxies(
    'https://www.moretools.app/zh-CN/github-proxy',
    timeoutMs: timeoutMs,
  );
  if (moretools != null) hosts.addAll(_extractMoretoolsHosts(moretools));

  final home = await _fetchViaProxies(
    'https://github.akams.cn/',
    timeoutMs: timeoutMs,
  );
  if (home != null) {
    final chunks = RegExp(r'/_next/static/chunks/[a-z0-9]+\.js')
        .allMatches(home)
        .map((m) => m.group(0)!)
        .toSet()
        .take(8)
        .toList();
    final results = await Future.wait(
      chunks.map(
        (chunk) => _fetchViaProxies(
          'https://github.akams.cn$chunk',
          timeoutMs: timeoutMs,
        ),
      ),
    );
    for (final js in results) {
      if (js != null) hosts.addAll(_extractAkamsHosts(js));
    }
  }

  return hosts.where(_hostPattern.hasMatch).toList();
}

/// 把运行时发现的主机并入镜像列表（去重，不覆盖内置项）。
List<MirrorConfig> mergeDiscoveredMirrors(
  List<MirrorConfig> current,
  List<String> hosts,
) {
  final known = current.map((m) => m.id).toSet();
  final fresh = hosts
      .where((host) => !known.contains(host) && host != 'github.akams.cn')
      .map(
        (host) => MirrorConfig(
          id: host,
          name: host,
          kind: 'proxy',
          testUrl: 'https://$host/',
        ),
      )
      .toList();
  return fresh.isEmpty ? current : [...current, ...fresh];
}
