import 'dart:js_interop';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:web/web.dart' as web;

import 'pages/docs_page.dart';
import 'pages/download_page.dart';
import 'pages/home_page.dart';
import 'theme.dart';
import 'widgets/html_image.dart';

/// 新标签页打开链接（下载等外跳）。
void openInNewTab(String url) {
  web.window.open(url, '_blank');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LxmApp());
}

class LxmApp extends StatefulWidget {
  const LxmApp({super.key});

  static _LxmAppState of(BuildContext context) =>
      context.findAncestorStateOfType<_LxmAppState>()!;

  @override
  State<LxmApp> createState() => _LxmAppState();
}

class _LxmAppState extends State<LxmApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode =
          _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'LX-M Music',
      debugShowCheckedModeBanner: false,
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: _themeMode,
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => SiteChrome(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, _) => const HomePage()),
        GoRoute(path: '/download', builder: (_, _) => const DownloadPage()),
        GoRoute(path: '/docs', builder: (_, _) => const DocsPage()),
        GoRoute(
          path: '/docs/:id',
          builder: (_, state) =>
              DocDetailPage(docId: state.pathParameters['id'] ?? ''),
        ),
      ],
    ),
  ],
);

/// 站点骨架：顶栏（Logo + 字标 + 导航 + 主题切换）+ 移动抽屉
/// （小狐狸面板 + 白底角色看板）+ 页脚。
class SiteChrome extends StatefulWidget {
  final Widget child;

  const SiteChrome({super.key, required this.child});

  @override
  State<SiteChrome> createState() => _SiteChromeState();
}

class _SiteChromeState extends State<SiteChrome> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final location = GoRouterState.of(context).uri.path;
    final isWide = MediaQuery.of(context).size.width >= 900;

    return Scaffold(
      key: _scaffoldKey,
      endDrawer: isWide ? null : const SiteDrawer(),
      appBar: _SiteBar(
        location: location,
        onMenu: () => _scaffoldKey.currentState?.openEndDrawer(),
      ),
      body: widget.child,
      bottomNavigationBar: _SiteFooter(theme: theme),
    );
  }
}

class _NavItem {
  final String label;
  final String route;

  const _NavItem(this.label, this.route);
}

const _navItems = <_NavItem>[
  _NavItem('首页', '/'),
  _NavItem('文档', '/docs'),
  _NavItem('下载', '/download'),
];

const _appRepoUrl =
    'https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop';

class _SiteBar extends StatelessWidget implements PreferredSizeWidget {
  final String location;
  final VoidCallback onMenu;

  const _SiteBar({required this.location, required this.onMenu});

  bool _active(String route, String location) =>
      route == '/' ? location == '/' : location.startsWith(route);

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isWide = MediaQuery.of(context).size.width >= 900;

    return AppBar(
      backgroundColor: theme.scaffoldBackgroundColor.withValues(alpha: 0.86),
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: theme.colorScheme.outlineVariant),
      ),
      title: InkWell(
        onTap: () => context.go('/'),
        borderRadius: BorderRadius.circular(10),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/img/app-icon-256.png',
                width: 30,
                height: 30,
              ),
            ),
            const SizedBox(width: 9),
            Text(
              'LX-M',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.02,
              ),
            ),
          ],
        ),
      ),
      actions: [
        if (isWide)
          for (final item in _navItems)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: TextButton(
                onPressed: () => context.go(item.route),
                style: TextButton.styleFrom(
                  foregroundColor: _active(item.route, location)
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurface.withValues(alpha: 0.75),
                  backgroundColor: _active(item.route, location)
                      ? theme.colorScheme.primary.withValues(alpha: 0.12)
                      : Colors.transparent,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: Text(item.label),
              ),
            ),
        IconButton(
          tooltip: '切换亮暗主题',
          onPressed: LxmApp.of(context).toggleTheme,
          icon: Icon(
            theme.brightness == Brightness.dark
                ? Icons.light_mode_outlined
                : Icons.dark_mode_outlined,
          ),
        ),
        IconButton(
          tooltip: 'GitHub',
          onPressed: () => openInNewTab(_appRepoUrl),
          icon: const Icon(Icons.code),
        ),
        if (!isWide)
          IconButton(
            tooltip: '菜单',
            onPressed: onMenu,
            icon: const Icon(Icons.menu),
          ),
        const SizedBox(width: 6),
      ],
    );
  }
}

/// 移动端抽屉：小狐狸面板 + 白底角色看板 + 导航链接。
class SiteDrawer extends StatelessWidget {
  const SiteDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final location = GoRouterState.of(context).uri.path;

    return Drawer(
      width: 320,
      backgroundColor: theme.scaffoldBackgroundColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            const _FoxPanel(),
            const SizedBox(height: 12),
            for (final item in _navItems)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: ListTile(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  tileColor: location == item.route
                      ? theme.colorScheme.primary.withValues(alpha: 0.12)
                      : null,
                  leading: Icon(
                    switch (item.route) {
                      '/' => Icons.home_outlined,
                      '/docs' => Icons.description_outlined,
                      _ => Icons.download_outlined,
                    },
                    color: location == item.route
                        ? theme.colorScheme.primary
                        : null,
                  ),
                  title: Text(item.label),
                  onTap: () {
                    Navigator.of(context).pop();
                    context.go(item.route);
                  },
                ),
              ),
            ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              leading: const Icon(Icons.code),
              title: const Text('GitHub'),
              onTap: () => openInNewTab(_appRepoUrl),
            ),
            const SizedBox(height: 16),
            const _BdBanner(),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                'LX-M Music · 免费开源的音乐播放器',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 小狐狸面板：每次打开抽屉随机一张（alcy 接口每次请求返回不同图）。
class _FoxPanel extends StatelessWidget {
  const _FoxPanel();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final url =
        'https://t.alcy.cc/xhl?t=${DateTime.now().millisecondsSinceEpoch}';
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 150,
        child: Stack(
          fit: StackFit.expand,
          children: [
            HtmlImageView(url: url),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.72),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              left: 14,
              right: 14,
              bottom: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'LX-M Music',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    '免费开源的音乐播放器',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 白底角色看板。
class _BdBanner extends StatelessWidget {
  const _BdBanner();

  @override
  Widget build(BuildContext context) {
    final url =
        'https://t.alcy.cc/bd?t=${DateTime.now().millisecondsSinceEpoch}';
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Container(
        color: Colors.white,
        height: 150,
        child: Stack(
          fit: StackFit.expand,
          children: [
            HtmlImageView(url: url, fitBottom: true),
            Positioned(
              top: 8,
              left: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: const Color(0x1A0F172A)),
                ),
                child: const Text(
                  '每日看板',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SiteFooter extends StatelessWidget {
  final ThemeData theme;

  const _SiteFooter({required this.theme});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark
            ? const Color(0xFF0B1120)
            : const Color(0xFFEFF3F6),
        border: Border(
          top: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'LX-M Music · 免费开源的音乐播放器',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '基于 LX Music (Apache License 2.0) 构建 · 站点内容 MIT',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }
}
