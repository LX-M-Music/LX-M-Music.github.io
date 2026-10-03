import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SectionHeader from '@site/src/components/SectionHeader';
import FeatureCard from '@site/src/components/FeatureCard';
import MediaBackdrop, {
  ACG_VIDEO,
  MOEZ_IMAGE,
  YCY_IMAGE,
} from '@site/src/components/MediaBackdrop';
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  FEATURES,
  HERO_BADGES,
  type ComparisonCell,
} from '@site/src/data/homepage';
import styles from './index.module.css';

const APP_REPO_URL =
  'https://github.com/LX-M-Music/lx-m_lx-Miao-moe-music-desktop';

function HeroSection() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <MediaBackdrop
        className={styles.heroBackdrop}
        sources={[
          {kind: 'video', url: ACG_VIDEO},
          {kind: 'image', url: MOEZ_IMAGE},
          {kind: 'image', url: YCY_IMAGE},
        ]}
      />
      <div className="container">
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
            <div className={styles.badges}>
              {HERO_BADGES.map(badge => (
                <span key={badge} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
            <div className={styles.buttons}>
              <Link className="button button--primary button--lg" to="/desktop/">
                阅读文档
              </Link>
              <Link className="button button--secondary button--lg" to="/download">
                立即下载
              </Link>
              <Link
                className="button button--outline button--lg"
                href={APP_REPO_URL}>
                GitHub
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <img
              src="/img/app-icon-512.png"
              alt="LX-M Music 应用图标"
              className={styles.heroIcon}
              width="168"
              height="168"
            />
            <span className={styles.heroVisualCaption}>LX-M Music 桌面版</span>
          </div>
        </div>
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
  if (cell.tone === 'no') return <>—</>;
  if (cell.tone === 'partial') return <>部分 · {cell.text}</>;
  return <>{cell.text ?? '支持'}</>;
}

function ComparisonSection() {
  return (
    <section className={styles.comparisonSection}>
      <div className="container">
        <SectionHeader
          title="版本对比"
          subtitle="LX-M 与原版、移动版的差异"
        />
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
              下载软件
            </Link>
            <Link className="button button--outline button--lg" to="/desktop/">
              查看文档
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
