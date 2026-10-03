import React, {useMemo, type ReactNode} from 'react';
import clsx from 'clsx';
import {useNavbarSecondaryMenu} from '@docusaurus/theme-common/internal';
import {ThemeClassNames} from '@docusaurus/theme-common';
import type {Props} from '@theme/Navbar/MobileSidebar/Layout';
import styles from './styles.module.css';

function FoxPanel(): ReactNode {
  // 每次打开抽屉都随机刷新一张小狐狸图
  const src = useMemo(
    () => `https://t.alcy.cc/xhl?t=${Date.now()}`,
    [],
  );
  return (
    <div className={styles.foxPanel}>
      <img
        src={src}
        alt="小狐狸"
        className={styles.foxImage}
        loading="eager"
        decoding="async"
      />
      <div className={styles.foxMask} />
      <div className={styles.foxCaption}>
        <span className={styles.foxTitle}>LX-M Music</span>
        <span className={styles.foxSubtitle}>免费开源的音乐播放器</span>
      </div>
    </div>
  );
}

function BdBanner(): ReactNode {
  // 白底横图，角色在角落，作为抽屉底部的装饰看板
  const src = useMemo(
    () => `https://t.alcy.cc/bd?t=${Date.now()}`,
    [],
  );
  return (
    <div className={styles.bdBanner}>
      <img
        src={src}
        alt="每日看板"
        className={styles.bdImage}
        loading="lazy"
        decoding="async"
      />
      <span className={styles.bdLabel}>每日看板</span>
    </div>
  );
}

export default function NavbarMobileSidebarLayout({
  header,
  primaryMenu,
  secondaryMenu,
}: Props): ReactNode {
  const {shown: secondaryMenuShown} = useNavbarSecondaryMenu();
  return (
    <div
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.container,
        'navbar-sidebar',
      )}>
      {header}
      <FoxPanel />
      <div
        className={clsx('navbar-sidebar__items', {
          'navbar-sidebar__items--show-secondary': secondaryMenuShown,
        })}>
        <Panel inert={secondaryMenuShown}>{primaryMenu}</Panel>
        <Panel inert={!secondaryMenuShown}>{secondaryMenu}</Panel>
      </div>
      <BdBanner />
    </div>
  );
}

function Panel({
  children,
  inert,
}: {
  children: ReactNode;
  inert: boolean;
}) {
  // 项目运行在 React 19，inert 是受支持的布尔属性
  return (
    <div
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.panel,
        'navbar-sidebar__item menu',
      )}
      {...(inert ? {inert: true} : {})}>
      {children}
    </div>
  );
}
