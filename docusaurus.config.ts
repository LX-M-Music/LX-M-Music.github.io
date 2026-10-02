import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'LX-M Music',
  tagline: '一个免费开源的音乐播放器 · 扩展音源 · Cookie同步 · 高音质解锁',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://miao-moe.github.io',
  baseUrl: '/lx-m-doc/',
  trailingSlash: false,

  organizationName: 'Miao-moe',
  projectName: 'lx-m-doc',

  onBrokenLinks: 'throw',
  markdown: {
    mdx1Compat: {
      comments: true,
      admonitions: true,
      headingIds: true,
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        direction: 'ltr',
        htmlLang: 'zh-Hans',
        calendar: 'gregory',
      }
    }
  },

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      ({
        hashed: true,
        indexPages: true,
        language: ["en", "zh"],
      }),
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Miao-moe/lx-m-doc/tree/main/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    metadata: [
      {name: 'keywords', content: 'LX-M, LX-M Music, lx-music, 洛雪音乐, 扩展音源, Cookie同步, 高音质'},
      {name: 'description', content: 'LX-M Music 桌面版说明文档 - 扩展音源插件机制、Cookie同步、Fluent UI风格'},
    ],
    navbar: {
      title: 'LX-M Music',
      logo: {
        alt: 'LX-M Music Logo',
        src: 'img/logo.svg',
      },
      items: [
        { type: 'doc', docId: 'desktop/index', position: 'left', label: '文档' },
        { type: 'doc', docId: 'desktop/custom-source', position: 'left', label: '自定义音源' },
        { type: 'doc', docId: 'desktop/ext-source-plugin', position: 'left', label: '扩展插件' },
        { to: '/download', label: '软件下载', position: 'left'},
        {
          href: 'https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            { label: '快速开始', to: '/desktop/' },
            { label: '自定义音源', to: '/desktop/custom-source' },
            { label: '扩展音源插件', to: '/desktop/ext-source-plugin' },
            { label: 'Cookie同步', to: '/desktop/cookie-sync' },
          ],
        },
        {
          title: '社区',
          items: [
            { label: 'GitHub Issues', href: 'https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop/issues' },
            { label: '软件下载', to: '/download' },
          ],
        },
        {
          title: '相关项目',
          items: [
            { label: 'LX-Music (原版)', href: 'https://github.com/lyswhut/lx-music-desktop' },
            { label: 'LX-X (移动版)', href: 'https://github.com/WalnutBai/lx-lxnetease-music-mobile-pro' },
            { label: '音源管理后台', href: 'http://171.80.3.149:3004' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Miao-moe & Contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
