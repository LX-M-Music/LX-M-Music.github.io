import type {
  MirrorConfig,
  PlatformConfig,
  ReleaseInfo,
  SpeedResult,
} from '@site/src/data/download';
import {assetsForPlatform, buildDownloadUrl, formatBytes} from '@site/src/data/download';
import styles from './DownloadCard.module.css';

export default function DownloadCard({
  platform,
  release,
  mirrors,
  results,
  selectedId,
  onSelect,
}: {
  platform: PlatformConfig;
  release: ReleaseInfo | null;
  mirrors: MirrorConfig[];
  results: SpeedResult[];
  selectedId: string;
  onSelect: (mirrorId: string) => void;
}) {
  const resultById = new Map(results.map(r => [r.id, r]));
  const selectedMirror =
    mirrors.find(m => m.id === selectedId) ?? mirrors[0];
  const selectedResult = resultById.get(selectedMirror?.id ?? '');

  const optionLabel = (mirror: MirrorConfig): string => {
    const result = resultById.get(mirror.id);
    if (result?.state === 'done' && result.latency !== null) {
      return `${mirror.name}（${result.latency}ms）`;
    }
    if (result?.state === 'error') return `${mirror.name}（不可用）`;
    return mirror.name;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img
          src={platform.iconSrc}
          alt=""
          className={styles.icon}
          loading="lazy"
        />
        <div>
          <h3>{platform.name}</h3>
          <p>{platform.description}</p>
        </div>
      </div>

      <div className={styles.mirrorSelector}>
        <label htmlFor={`mirror-${platform.id}`}>下载镜像</label>
        <select
          id={`mirror-${platform.id}`}
          value={selectedMirror?.id}
          onChange={event => onSelect(event.target.value)}
          className={styles.select}
          disabled={!release}>
          {mirrors.map(mirror => (
            <option key={mirror.id} value={mirror.id}>
              {optionLabel(mirror)}
            </option>
          ))}
        </select>
        {selectedResult?.state === 'done' && selectedResult.latency !== null && (
          <span className={styles.latency}>{selectedResult.latency}ms</span>
        )}
      </div>

      <div className={styles.fileList}>
        {!release ? (
          <div className={styles.empty}>正在获取版本信息…</div>
        ) : (
          (() => {
            const assets = assetsForPlatform(release, platform);
            if (assets.length === 0) {
              return (
                <div className={styles.empty}>
                  暂无该平台安装包，可关注后续 Release
                </div>
              );
            }
            return assets.map(asset => (
              <div key={asset.name} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <span
                    className={styles.fileName}
                    title={asset.digest ?? asset.name}>
                    {asset.name}
                  </span>
                  <span className={styles.fileMeta}>
                    {formatBytes(asset.size)} · {asset.download_count} 次下载
                  </span>
                </div>
                <a
                  href={buildDownloadUrl(
                    selectedMirror,
                    release.tag_name,
                    asset.name,
                  )}
                  className="button button--primary button--sm"
                  target="_blank"
                  rel="noopener noreferrer">
                  下载
                </a>
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
