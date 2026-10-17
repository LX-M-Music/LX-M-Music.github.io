import 'dart:async';
import 'dart:js_interop';

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import 'dart:ui_web' as ui_web;

/// 单个背景源。
class MediaSource {
  final String url;
  final bool isVideo;

  const MediaSource.image(String url)
      : url = url,
        isVideo = false;

  const MediaSource.video(String url)
      : url = url,
        isVideo = true;
}

/// 全幅媒体背景（Flutter Web 专用）：
/// 所有源挂载时各请求一次并分层常驻，仅在已就绪的层之间轮换——
/// 不会因重新下载而闪烁。蒙版在 HTML 层内完成，保证前景可读。
class MediaBackdrop extends StatefulWidget {
  final List<MediaSource> sources;
  final Brightness brightness;
  final bool rotate; // false = 只展示第一层就绪的画面

  const MediaBackdrop({
    super.key,
    required this.sources,
    required this.brightness,
    this.rotate = true,
  });

  @override
  State<MediaBackdrop> createState() => _MediaBackdropState();
}

class _MediaBackdropState extends State<MediaBackdrop> {
  late final String _viewType;
  final List<web.HTMLElement?> _layers = [];
  final List<bool> _ready = [];
  web.HTMLVideoElement? _video;
  web.HTMLDivElement? _mask;
  int _videoIndex = -1;
  int _active = -1;
  Timer? _rotateTimer;

  @override
  void initState() {
    super.initState();
    _viewType = 'lxm-backdrop-${identityHashCode(widget)}-${widget.sources.length}';
    _buildLayers();
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      return _buildDom();
    });
    if (widget.rotate) {
      _rotateTimer = Timer.periodic(const Duration(seconds: 18), (_) => _rotate());
    }
  }

  @override
  void didUpdateWidget(covariant MediaBackdrop old) {
    super.didUpdateWidget(old);
    if (old.brightness != widget.brightness) _applyMask();
  }

  void _buildLayers() {
    for (var i = 0; i < widget.sources.length; i++) {
      _layers.add(null);
      _ready.add(false);
    }
    _videoIndex = widget.sources.indexWhere((s) => s.isVideo);
  }

  web.HTMLDivElement _buildDom() {
    final root = web.HTMLDivElement()
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.position = 'relative'
      ..style.overflow = 'hidden'
      ..style.background =
          'radial-gradient(120% 90% at 80% 10%, rgba(74,222,128,0.14) 0%, transparent 55%), linear-gradient(160deg, #0b1220 0%, #101a2b 55%, #0b1220 100%)';

    for (var i = 0; i < widget.sources.length; i++) {
      final source = widget.sources[i];
      if (source.isVideo) {
        final video = web.HTMLVideoElement()
          ..className = 'lxm-layer'
          ..src = source.url
          ..muted = true
          ..loop = true
          ..setAttribute('playsinline', '');
          video.autoplay = false;
          video.preload = 'auto';
        video.onloadeddata = ((web.Event _) => _markReady(i)).toJS;
        video.onerror = ((web.Event _) {}).toJS;
        _video = video;
        _layers[i] = video;
        root.appendChild(video);
      } else {
        final img = web.HTMLImageElement()
          ..className = 'lxm-layer'
          ..src = source.url
          ..setAttribute('decoding', 'async');
        img.onload = ((web.Event _) => _markReady(i)).toJS;
        img.onerror = ((web.Event _) {}).toJS;
        _layers[i] = img;
        root.appendChild(img);
      }
    }

    _mask = web.HTMLDivElement()..className = 'lxm-mask';
    _applyMask();
    root.appendChild(_mask!);
    return root;
  }

  void _applyMask() {
    final mask = _mask;
    if (mask == null) return;
    mask.className =
        widget.brightness == Brightness.dark ? 'lxm-mask' : 'lxm-mask lxm-mask-light';
  }

  void _markReady(int index) {
    if (_ready[index]) return;
    _ready[index] = true;
    if (_active == -1) _activate(index);
  }

  void _activate(int index) {
    if (_active == index) return;
    // 旧层保持 opacity:1 由 CSS 过渡交接，新层淡入
    for (var i = 0; i < _layers.length; i++) {
      final layer = _layers[i];
      if (layer == null) continue;
      if (i == index) {
        layer.classList.add('lxm-layer-active');
      } else {
        layer.classList.remove('lxm-layer-active');
      }
    }
    _active = index;
    _syncVideo();
  }

  void _syncVideo() {
    final video = _video;
    if (video == null || _videoIndex < 0) return;
    if (_active == _videoIndex) {
      video.play().toDart.then<void>((_) {}, onError: (Object _) {});
    } else {
      video.pause();
    }
  }

  void _rotate() {
    final total = widget.sources.length;
    if (total <= 1) return;
    final start = (_active + 1) % total;
    for (var step = 0; step < total; step++) {
      final candidate = (start + step) % total;
      if (_ready[candidate]) {
        _activate(candidate);
        return;
      }
    }
  }

  @override
  void dispose() {
    _rotateTimer?.cancel();
    _video?.pause();
    _video?.removeAttribute('src');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
