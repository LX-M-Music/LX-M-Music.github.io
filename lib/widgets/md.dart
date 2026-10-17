import 'package:flutter/material.dart';
import 'package:markdown_widget/markdown_widget.dart';

import '../main.dart';

/// 站点统一的 Markdown 渲染配置（文档页与更新说明共用）。
MarkdownConfig markdownConfig(ThemeData theme) {
  final body = theme.textTheme.bodyMedium!.copyWith(
    height: 1.75,
    color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
  );
  final heading = theme.colorScheme.onSurface;
  final codeBg = theme.colorScheme.onSurface.withValues(alpha: 0.07);

  return MarkdownConfig(configs: [
    H1Config(
      style: theme.textTheme.headlineSmall!.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: heading,
      ),
    ),
    H2Config(
      style: theme.textTheme.titleLarge!.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
        color: heading,
      ),
    ),
    H3Config(
      style: theme.textTheme.titleMedium!.copyWith(
        fontWeight: FontWeight.w700,
        color: heading,
      ),
    ),
    PConfig(textStyle: body),
    CodeConfig(
      style: theme.textTheme.bodySmall!.copyWith(
        backgroundColor: codeBg,
        fontFamily: 'monospace',
      ),
    ),
    LinkConfig(
      style: body.copyWith(color: theme.colorScheme.primary),
      onTap: (url) => openInNewTab(url),
    ),
    BlockquoteConfig(
      sideColor: theme.colorScheme.primary,
      textColor: theme.colorScheme.onSurface.withValues(alpha: 0.7),
    ),
  ]);
}
