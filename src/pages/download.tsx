import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SpeedTestPanel from '@site/src/components/download/SpeedTestPanel';
import DownloadCard from '@site/src/components/download/DownloadCard';
import {
  INSTALL_GUIDE,
  PLATFORMS,
  RELEASES_URL,
  type ReleaseInfo,
  type SpeedResult,
  bestMirrorId,
  fetchLatestRelease,
  formatDate,
  loadMirrors,
  probeAllMirrors,
} from '@site/src/data/download';
import styles from './download.module.css';

export default function DownloadPage(): ReactNode {
  const mirrors = useMemo(loadMirrors, []);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [speedResults, setSpeedResults] = useState<SpeedResult[]>(() =>
    mirrors.map(mirror => ({id: mirror.id, latency: null, state: 'pending'})),
  );
  const [isTesting, setIsTesting] = useState(false);
  // 访客在单个平台卡片里手动选择的镜像；未手动选择时跟随推荐结果
  const [picks, setPicks] = useState<Record<string, string>>({});

  const runSpeedTest = useCallback(async () => {
    setIsTesting(true);
    setSpeedResults(
      mirrors.map(mirror => ({id: mirror.id, latency: null, state: 'pending'})),
    );
    await probeAllMirrors(mirrors, {
      concurrency: 8,
      timeoutMs: 5000,
      onResult: (id, latency) => {
        setSpeedResults(prev =>
          prev.map(result =>
            result.id === id
              ? {
                  ...result,
                  latency,
                  state: latency === null ? 'error' : 'done',
                }
              : result,
          ),
        );
      },
    });
    setIsTesting(false);
    // mirrors 在页面生命周期内不变，依赖仅它即可
  }, [mirrors]);

  // 进入下载页即自动测速：每个访客用自己的网络得到真实结果
  useEffect(() => {
    void runSpeedTest();
  }, [runSpeedTest]);

  useEffect(() => {
    fetchLatestRelease()
      .then(setRelease)
      .catch((err: unknown) => {
        setReleaseError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  const best = bestMirrorId(speedResults);

  return (
    <Layout
      title="软件下载"
      description="LX-M Music 桌面版下载 - 自动发现多个加速镜像，基于您的网络实测并预选最快节点">
      <main className={styles.page}>
        <div className={styles.hero}>
          <div className="container">
            <Heading as="h1" className={styles.title}>
              ⬇️ 软件下载
            </Heading>
            <p className={styles.subtitle}>
              自动发现可用加速镜像，进入页面即按您的网络实测，自动预选最快节点
            </p>
          </div>
        </div>

        <div className="container">
          {release && (
            <div className={styles.versionInfo}>
              <div className={styles.versionBadge}>
                <span className={styles.versionTag}>📦 {release.tag_name}</span>
                <span className={styles.versionDate}>
                  发布于 {formatDate(release.published_at)}
                </span>
              </div>
              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.releaseLink}>
                查看 Release 详情 →
              </a>
            </div>
          )}

          <SpeedTestPanel
            mirrors={mirrors}
            results={speedResults}
            isTesting={isTesting}
            bestId={best}
            onRetest={() => void runSpeedTest()}
          />

          {releaseError && (
            <div className={styles.errorBox}>
              <p>⚠️ 获取版本信息失败：{releaseError}</p>
              <p>您可以尝试直接访问 GitHub Release 页面下载：</p>
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--primary">
                前往 GitHub Release
              </a>
            </div>
          )}

          {!releaseError && (
            <div className={styles.platformsGrid}>
              {PLATFORMS.map(platform => (
                <DownloadCard
                  key={platform.id}
                  platform={platform}
                  release={release}
                  mirrors={mirrors}
                  results={speedResults}
                  selectedId={picks[platform.id] ?? best ?? 'github'}
                  onSelect={mirrorId =>
                    setPicks(prev => ({...prev, [platform.id]: mirrorId}))
                  }
                />
              ))}
            </div>
          )}

          <div className={styles.installGuide}>
            <h2>📋 安装说明</h2>
            <div className={styles.guideGrid}>
              {INSTALL_GUIDE.map(section => (
                <div key={section.title} className={styles.guideCard}>
                  <h3>
                    {section.icon} {section.title}
                  </h3>
                  <ul>
                    {section.items.map(item => (
                      <li key={item.label}>
                        <strong>{item.label}</strong>：{item.description}
                      </li>
                    ))}
                  </ul>
                  {section.note && <p className={styles.guideNote}>{section.note}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.safetyNotice}>
            <h3>🛡️ 安全提示</h3>
            <p>
              如果杀毒软件报毒，请先确认软件是从本页面或{' '}
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer">
                GitHub Release
              </a>{' '}
              下载的。确认为官方渠道下载后，大概率是误报；加速镜像仅代理官方
              Release 文件，下载后可比对 Release 页中的 SHA-256 校验值。
            </p>
            <p className={styles.safetySub}>
              我们不对第三方渠道下载的安全性作任何保证。
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
