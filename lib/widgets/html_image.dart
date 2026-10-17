import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
import 'dart:ui_web' as ui_web;

/// 用原生 <img> 展示跨域图片。t.alcy.cc 等无 CORS 头的图源
/// 无法通过 Flutter 的 Image.network 绘制（画布污染拦截），
/// 必须走 HtmlElementView。
class HtmlImageView extends StatelessWidget {
  final String url;
  final bool fitBottom;

  const HtmlImageView({super.key, required this.url, this.fitBottom = false});

  @override
  Widget build(BuildContext context) {
    final viewType = 'lxm-img-${url.hashCode.toUnsigned(30)}-${fitBottom ? 1 : 0}';
    _register(viewType, url, fitBottom);
    return HtmlElementView(viewType: viewType);
  }
}

final _registered = <String>{};

void _register(String viewType, String url, bool fitBottom) {
  if (_registered.contains(viewType)) return;
  _registered.add(viewType);
  ui_web.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
    final img = web.HTMLImageElement()
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.objectFit = fitBottom ? 'cover' : 'cover'
      ..style.objectPosition = fitBottom ? 'center bottom' : 'center'
      ..setAttribute('decoding', 'async')
      ..src = url;
    return img;
  });
}

/// 用原生 <video> 展示动图（t.alcy.cc /acg 返回 MP4）。
class HtmlVideoView extends StatelessWidget {
  final String url;

  const HtmlVideoView({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    final viewType = 'lxm-video-${url.hashCode.toUnsigned(30)}';
    _registerVideo(viewType, url);
    return HtmlElementView(viewType: viewType);
  }
}

final _registeredVideos = <String>{};

void _registerVideo(String viewType, String url) {
  if (_registeredVideos.contains(viewType)) return;
  _registeredVideos.add(viewType);
  ui_web.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
    final video = web.HTMLVideoElement()
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.objectFit = 'cover'
      ..muted = true
      ..loop = true
      ..autoplay = true
      ..setAttribute('playsinline', '')
      ..src = url;
    return video;
  });
}
