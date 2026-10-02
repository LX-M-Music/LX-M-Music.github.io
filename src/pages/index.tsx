import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SectionHeader from '@site/src/components/SectionHeader';
import FeatureCard from '@site/src/components/FeatureCard';
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  FEATURES,
  HERO_BADGES,
  type ComparisonCell,
} from '@site/src/data/homepage';
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
              {HERO_BADGES.map(badge => (
                <span key={badge} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
            <div className={styles.buttons}>
              <Link className="button button--primary button--lg" to="/desktop/">
                📖 阅读文档
              </Link>
              <Link className="button button--secondary button--lg" to="/download">
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
              <div className={styles.heroLogoGlow} />
              <svg
                className={styles.heroLogo}
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">
                <rect width="120" height="120" rx="24" fill="url(#grad1)" />
                <path
                  d="M40 85V45L85 35V75"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="55" cy="75" r="10" fill="white" />
                <circle cx="85" cy="65" r="10" fill="white" />
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="120" y2="120">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heroWave}>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="var(--ifm-background-color)"
          />
        </svg>
      </div>
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <SectionHeader
          title="核心特性"
          subtitle="在 LX Music 原版基础上，新增多项增强功能"
        />
        <div className={styles.featuresGrid}>
          {FEATURES.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonCellContent({cell}: {cell: ComparisonCell}) {
  if (cell.tone === 'no') return <>❌</>;
  if (cell.tone === 'partial') return <>⚠️ {cell.text}</>;
  return (
    <>
      ✅{cell.text ? ` ${cell.text}` : ''}
    </>
  );
}

function ComparisonSection() {
  return (
    <section className={styles.comparisonSection}>
      <div className="container">
        <SectionHeader
          title="版本对比"
          subtitle="LX-M 与原版、移动版的差异"
        />
        <div className={styles.comparisonTableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>特性</th>
                {COMPARISON_COLUMNS.map((column, idx) => (
                  <th key={column} className={idx === 2 ? styles.currentCol : undefined}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(row => (
                <tr key={row.feature}>
                  <td className={styles.featureName}>{row.feature}</td>
                  {row.cells.map((cell, idx) => (
                    <td key={idx} className={clsx(styles.center, styles[cell.tone])}>
                      <ComparisonCellContent cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
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
          <h2 className={styles.ctaTitle}>准备好开始了吗？</h2>
          <p className={styles.ctaText}>
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
