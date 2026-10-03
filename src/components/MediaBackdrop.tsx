import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './MediaBackdrop.module.css';

export type MediaSource =
  | {kind: 'video'; url: string}
  | {kind: 'image'; url: string};

export const ACG_VIDEO = 'https://t.alcy.cc/acg';
export const MOEZ_IMAGE = 'https://t.alcy.cc/moez';
export const YCY_IMAGE = 'https://t.alcy.cc/ycy';
export const BD_BANNER = 'https://t.alcy.cc/bd';
export const XHL_FOX = 'https://t.alcy.cc/xhl';

const ROTATE_MS = 14_000;

/** 随机图/视频接口：每次请求返回不同资源，加时间戳避免 302 被缓存 */
function freshUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * 全幅媒体背景：ACG 动图(MP4)与萌图(webp)自动轮换，渐变蒙版保证前景可读。
 * 任一资源加载失败自动跳到下一个；系统开启"减弱动态效果"时只用静态图。
 */
export default function MediaBackdrop({
  sources,
  className,
}: {
  sources: MediaSource[];
  className?: string;
}) {
  const isBrowser = useIsBrowser();
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useMemo(() => isBrowser && prefersReducedMotion(), [isBrowser]);

  const effectiveSources = useMemo(() => {
    if (!isBrowser) return [];
    if (reduceMotion) {
      return sources.filter(s => s.kind === 'image');
    }
    return sources;
  }, [isBrowser, reduceMotion, sources]);

  const next = useCallback(() => {
    setLoaded(false);
    setIndex(i => (i + 1) % Math.max(effectiveSources.length, 1));
  }, [effectiveSources.length]);

  useEffect(() => {
    if (effectiveSources.length <= 1) return undefined;
    const timer = setInterval(next, ROTATE_MS);
    return () => clearInterval(timer);
  }, [effectiveSources.length, next]);

  // 切换标签页时暂停视频，回到前台继续
  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleLoaded = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => next(), [next]);

  if (!isBrowser || effectiveSources.length === 0) {
    return <div className={`${styles.backdrop} ${className ?? ''}`} aria-hidden="true" />;
  }

  const source = effectiveSources[index % effectiveSources.length];
  const src = freshUrl(source.url);

  return (
    <div className={`${styles.backdrop} ${className ?? ''}`} aria-hidden="true">
      {source.kind === 'video' ? (
        <video
          key={src}
          ref={videoRef}
          className={`${styles.media} ${loaded ? styles.mediaLoaded : ''}`}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleLoaded}
          onError={handleError}
        />
      ) : (
        <img
          key={src}
          className={`${styles.media} ${loaded ? styles.mediaLoaded : ''}`}
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          onLoad={handleLoaded}
          onError={handleError}
        />
      )}
      {/* 蒙版：压暗背景，保证前景内容对比度 */}
      <div className={styles.mask} />
    </div>
  );
}
