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

const ROTATE_MS = 18_000;

/**
 * 全幅媒体背景。
 *
 * 关键实现：所有源在挂载时各请求一次（随机图接口天然每次不同），分层常驻，
 * 只有加载完成的层才可能被激活，切换时旧层保持可见——彻底避免重新下载
 * 造成的闪烁。视频仅在激活时播放，离开即暂停。
 */
export default function MediaBackdrop({
  sources,
  className,
}: {
  sources: MediaSource[];
  className?: string;
}) {
  const isBrowser = useIsBrowser();
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const effectiveSources = useMemo(() => {
    if (!isBrowser) return [];
    return reduceMotion
      ? sources.filter(source => source.kind === 'image')
      : sources;
  }, [isBrowser, reduceMotion, sources]);

  const readyRef = useRef<boolean[]>([]);
  const [readyTick, setReadyTick] = useState(0);

  const markReady = useCallback((index: number) => {
    if (readyRef.current[index]) return;
    readyRef.current[index] = true;
    // 第一层就绪前保持渐变底色；就绪后立即点亮，无空窗
    if (activeRef.current === -1) {
      activeRef.current = index;
      setActive(index);
    }
    setReadyTick(t => t + 1);
  }, []);

  // 在已就绪的层之间轮换；未就绪的层跳过，绝不露底
  useEffect(() => {
    if (effectiveSources.length <= 1) return undefined;
    const timer = setInterval(() => {
      const total = effectiveSources.length;
      const start = (activeRef.current + 1) % total;
      for (let step = 0; step < total; step += 1) {
        const candidate = (start + step) % total;
        if (readyRef.current[candidate]) {
          activeRef.current = candidate;
          setActive(candidate);
          break;
        }
      }
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [effectiveSources.length]);

  // 视频只在激活时播放；切走即暂停，省电省流量
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [active, readyTick]);

  useEffect(() => {
    const onVisibility = () => {
      videoRefs.current.forEach((video, index) => {
        if (!video) return;
        if (document.hidden) video.pause();
        else if (index === activeRef.current) void video.play().catch(() => {});
      });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!isBrowser || effectiveSources.length === 0) {
    return <div className={`${styles.backdrop} ${className ?? ''}`} aria-hidden="true" />;
  }

  return (
    <div className={`${styles.backdrop} ${className ?? ''}`} aria-hidden="true">
      {effectiveSources.map((source, index) => {
        const isActive = index === active;
        if (source.kind === 'video') {
          return (
            <video
              key={source.url}
              ref={element => {
                videoRefs.current[index] = element;
              }}
              className={`${styles.layer} ${isActive ? styles.layerActive : ''}`}
              src={source.url}
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={() => markReady(index)}
              onError={() => {}}
            />
          );
        }
        return (
          <img
            key={source.url}
            className={`${styles.layer} ${isActive ? styles.layerActive : ''}`}
            src={source.url}
            alt=""
            decoding="async"
            onLoad={() => markReady(index)}
            onError={() => {}}
          />
        );
      })}
      {/* 蒙版：压暗背景，保证前景内容对比度 */}
      <div className={styles.mask} />
    </div>
  );
}
