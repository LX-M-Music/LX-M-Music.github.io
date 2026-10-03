import type {MirrorConfig, SpeedResult} from '@site/src/data/download';
import {latencyGrade} from '@site/src/data/download';
import styles from './SpeedTestPanel.module.css';

function badgeClass(result: SpeedResult): string {
  if (result.state === 'error') return styles.badgeError;
  if (result.latency !== null && result.latency < 1500) return styles.badgeFast;
  if (result.latency !== null && result.latency < 3000) return styles.badgeMedium;
  return styles.badgeSlow;
}

function badgeText(result: SpeedResult): string {
  if (result.state === 'pending') return '待测';
  if (result.state === 'error' || result.latency === null) return '不可用';
  return `${result.latency}ms · ${latencyGrade(result.latency)}`;
}

/** 测速结束后按延迟升序展示，失败节点靠后 */
function rankOf(result: SpeedResult): number {
  if (result.state === 'done' && result.latency !== null) return result.latency;
  return result.state === 'error' ? 1e9 : 1e12;
}

export default function SpeedTestPanel({
  mirrors,
  results,
  isTesting,
  bestId,
  onRetest,
  discoveredCount,
}: {
  mirrors: MirrorConfig[];
  results: SpeedResult[];
  isTesting: boolean;
  bestId: string | null;
  onRetest: () => void;
  discoveredCount: number;
}) {
  const done = results.filter(
    r => r.state === 'done' || r.state === 'error',
  ).length;
  const sorted = isTesting
    ? results
    : [...results].sort((a, b) => rankOf(a) - rankOf(b));

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>镜像测速</h3>
          <p className={styles.note}>
            由您的浏览器基于本机网络实时探测，结果因地区与运营商而异；测速完成后自动预选最快节点，您也可以在下方卡片中手动切换。
            {discoveredCount > 0 &&
              ` 本页已实时发现 ${discoveredCount} 个新节点，内置清单每日自动刷新。`}
          </p>
        </div>
        <div className={styles.actions}>
          <span className={styles.progress}>
            {isTesting ? `已测 ${done}/${mirrors.length}` : `共 ${mirrors.length} 个节点`}
          </span>
          <button
            type="button"
            className="button button--primary button--sm"
            onClick={onRetest}
            disabled={isTesting}>
            {isTesting ? '测速中…' : done > 0 ? '重新测速' : '开始测速'}
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {sorted.map(result => {
          const isBest = !isTesting && bestId !== null && result.id === bestId;
          return (
            <div
              key={result.id}
              className={`${styles.chip} ${isBest ? styles.best : ''}`}
              title={result.id}>
              <span className={styles.chipName}>{result.id}</span>
              <span className={`${styles.badge} ${badgeClass(result)}`}>
                {isBest && <span className={styles.bestTag}>最快</span>}
                {badgeText(result)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
