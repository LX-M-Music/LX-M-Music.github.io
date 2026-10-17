import 'package:flutter/material.dart';

/// 站点主题：Material 3，深色优先、亮色同样适配，品牌绿强调。
/// 字体使用打包的 NotoSansSC（国内访客无法访问 fonts.gstatic，必须内置）。

const brandGreen = Color(0xFF4ADE80);
const brandGreenDeep = Color(0xFF22C55E);
const darkScaffold = Color(0xFF0F172A);
const darkSurface = Color(0xFF161E2C);
const lightScaffold = Color(0xFFF6F8FA);
const lightSurface = Colors.white;

ThemeData buildDarkTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: brandGreenDeep,
    brightness: Brightness.dark,
  ).copyWith(
    primary: brandGreen,
    onPrimary: const Color(0xFF052E12),
    secondary: brandGreen,
    surface: darkSurface,
    onSurface: const Color(0xFFE2E8F0),
    surfaceContainerHighest: const Color(0xFF1C2739),
    outline: Colors.white.withValues(alpha: 0.10),
    outlineVariant: Colors.white.withValues(alpha: 0.06),
  );
  return _base(scheme, darkScaffold);
}

ThemeData buildLightTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: brandGreenDeep,
    brightness: Brightness.light,
  ).copyWith(
    primary: brandGreenDeep,
    onPrimary: Colors.white,
    surface: Colors.white,
    onSurface: const Color(0xFF1E293B),
    surfaceContainerHighest: const Color(0xFFEFF3F6),
    outline: const Color(0x1A0F172A),
    outlineVariant: const Color(0x140F172A),
  );
  return _base(scheme, lightScaffold);
}

ThemeData _base(ColorScheme scheme, Color scaffold) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scaffold,
    fontFamily: 'NotoSansSC',
    cardTheme: CardThemeData(
      color: scheme.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    dividerTheme: DividerThemeData(color: scheme.outlineVariant, thickness: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.onSurface.withValues(alpha: 0.04),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: BorderSide(color: scheme.primary),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    ),
  );
}
