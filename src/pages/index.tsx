import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HeroSection() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>🎵 扩展音源插件</span>
              <span className={styles.badge}>🍪 Cookie 同步</span>
              <span className={styles.badge}>🎧 高音质解锁</span>
              <span className={styles.badge}>✨ Fluent UI</span>
            </div>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="/desktop/">
                📖 阅读文档
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/download">
                ⬇️ 立即下载
              </Link>
              <Link
                className="button button--outline button--lg"
                href="https://github.com/Miao-moe/lx-m_lx-Miao-moe-music-desktop">
                ⭐ GitHub
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroLogoWrapper}>
              <div className={styles.heroLogoGlow}></div>
              <svg className={styles.heroLogo} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="120" height="120" rx="24" fill="url(#grad1)"/>
                <path d="M40 85V45L85 35V75" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="55" cy="75" r="10" fill="white"/>
                <circle cx="85" cy="65" r="10" fill="white"/>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="120" y2="120">
                    <stop offset="0%" stopColor="#4ade80"/>
                    <stop offset="100%" stopColor="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heroWave}>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="var(--ifm-background-color)"/>
        </svg>
      </div>
    </header>
  );
}

function FeatureCard({icon, title, description}: {icon: string; title: string; description: string}) {
  return (
    <div className="feature-card">
      <div className="feature-icon" style={{background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.1))'}}>
        {icon}
      </div>
      <h3 style={{fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--ifm-heading-color)'}}>{title}</h3>
      <p style={{color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.6, margin: 0}}>{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: '🔌',
      title: '扩展音源插件机制',
      description: '第三方音源不再内置进主程序，而是以独立插件形式存在。接口失效时只需更新插件，主程序无需发版。',
    },
    {
      icon: '🍪',
      title: 'Cookie 同步设置',
      description: '支持网易云、QQ音乐、酷狗、酷我、咪咕五大平台的 Cookie 同步，自动上报播放记录与收藏歌单。',
    },
    {
      icon: '🎨',
      title: 'Fluent UI 风格图标',
      description: '全部图标重新设计为 Microsoft Fluent UI 风格，24x24 viewBox，统一视觉重量，从 18 个扩展到 44 个。',
    },
    {
      icon: '🎧',
      title: '高音质解锁',
      description: '通过自定义音源脚本，支持 128k / 320k / flac / flac24bit / hires / atmos / master 七种音质。',
    },
    {
      icon: '⚡',
      title: '无缝衔接播放',
      description: '双 audio 引擎交叉淡化，避免歌曲切换的音频中断。支持渐入渐出效果，持续时间 100-3000ms 可调。',
    },
    {
      icon: '🔧',
      title: '高级设置面板',
      description: '平滑动画系统，0.5x-1.5x 动画速率可调。设置页支持 Alt+←/→ 快捷键切换面板。',
    },
  ];

  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 style={{fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem'}}>核心特性</h2>
          <p style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '1.1rem'}}>在 LX Music 原版基础上，新增多项增强功能</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className={styles.comparisonSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 style={{fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem'}}>版本对比</h2>
          <p style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '1.1rem'}}>LX-M 与原版、移动版的差异</p>
        </div>
        <div className={styles.comparisonTableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>特性</th>
                <th style={{textAlign: 'center'}}>LX 原版</th>
                <th style={{textAlign: 'center'}}>LX-X 移动版</th>
                <th style={{textAlign: 'center', color: '#4ade80'}}>LX-M 桌面版</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>扩展音源插件</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 解耦设计</td>
              </tr>
              <tr>
                <td>Cookie 同步</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 5 平台支持</td>
              </tr>
              <tr>
                <td>高音质解锁</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 自定义源</td>
                <td style={{textAlign: 'center', color: '#facc15'}}>⚠️ 部分 Cookie</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 自定义源</td>
              </tr>
              <tr>
                <td>Fluent UI 图标</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 44 个图标</td>
              </tr>
              <tr>
                <td>无缝衔接播放</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ 双引擎</td>
              </tr>
              <tr>
                <td>设置页快捷键</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#94a3b8'}}>❌</td>
                <td style={{textAlign: 'center', color: '#4ade80'}}>✅ Alt+←/→</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaCard}>
          <h2 style={{fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem'}}>准备好开始了吗？</h2>
          <p style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '1.1rem', marginBottom: '1.5rem'}}>
            下载 LX-M Music，体验扩展音源插件与 Cookie 同步带来的全新音乐体验。
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/download">
              ⬇️ 下载软件
            </Link>
            <Link className="button button--outline button--lg" to="/desktop/">
              📖 查看文档
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - 扩展音源 · Cookie同步 · 高音质`}
      description="LX-M Music 桌面版说明文档 - 在 LX Music 原版基础上新增扩展音源插件机制、Cookie同步、Fluent UI风格图标等增强功能">
      <main>
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <CTASection />
      </main>
    </Layout>
  );
}
