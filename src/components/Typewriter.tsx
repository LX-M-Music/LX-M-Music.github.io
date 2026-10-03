import {useEffect, useMemo, useState} from 'react';
import styles from './Typewriter.module.css';

const TYPE_MS = 110;
const ERASE_MS = 45;
const HOLD_MS = 2200;

/**
 * 打字机效果（等价于 GitHub README 常用的 typing SVG，但为原生矢量实现）：
 * 逐字打出 → 停留 → 逐字擦除 → 下一句，末尾带闪烁光标。
 * 系统开启"减弱动态效果"时静态显示第一句。
 */
export default function Typewriter({
  phrases,
  className,
}: {
  phrases: string[];
  className?: string;
}) {
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const [text, setText] = useState('');

  useEffect(() => {
    if (reduced || phrases.length === 0) return undefined;
    let phraseIndex = 0;
    let charIndex = 0;
    let erasing = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = phrases[phraseIndex];
      if (!erasing) {
        charIndex += 1;
        setText(phrase.slice(0, charIndex));
        if (charIndex >= phrase.length) {
          erasing = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        charIndex -= 1;
        setText(phrase.slice(0, charIndex));
        if (charIndex <= 0) {
          erasing = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, ERASE_MS);
      }
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [phrases, reduced]);

  const shown = reduced ? (phrases[0] ?? '') : text;

  return (
    <span className={className ?? styles.wrapper}>
      <span className={styles.text}>{shown}</span>
      <span className={styles.cursor} aria-hidden="true" />
    </span>
  );
}
