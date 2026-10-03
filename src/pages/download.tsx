import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SpeedTestPanel from '@site/src/components/download/SpeedTestPanel';
import DownloadCard from '@site/src/components/download/DownloadCard';
import MediaBackdrop, {
  MOEZ_IMAGE,
  YCY_IMAGE,
} from '@site/src/components/MediaBackdrop';
import {
  INSTALL_GUIDE,
  PLATFORMS,
  RELEASES_URL,
  type MirrorConfig,
  type ReleaseInfo,
  type SpeedResult,
  bestMirrorId,
  discoverRuntimeMirrors,
  fetchReleases,
  formatDate,
  loadMirrors,
  mergeDiscoveredMirrors,
  probeAllMirrors,
  renderReleaseNotes,
} from '@site/src/data/download';
import styles from './download.module.css';

function pendingResults(mirrors: MirrorConfig[]): SpeedResult[] {
  return mirrors.map(mirror => ({
    id: mirror.id,
    latency: null,
    state: 'pending',
  }));
}

export default function DownloadPage(): ReactNode {
  // 内置清单先渲染（每日定时任务刷新），运行时发现的节点随后并入
  const initialMirrors = useMemo(loadMirrors, []);
  const mirrorsRef = useRef<MirrorConfig[]>(initialMirrors);
  const [mirrors, setMirrors] = useState<MirrorConfig[]>(initialMirrors);
  const [releases, setReleases] = useState<ReleaseInfo[] | null>(null);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [speedResults, setSpeedResults] = useState<SpeedResult[]>(() =>
    pendingResults(initialMirrors),
  );
  const [isTesting, setIsTesting] = useState(false);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  // 访客在单个平台卡片里手动选择的镜像；未手动选择时跟随推荐结果
  const [picks, setPicks] = useState<Record<string, string>>({});

  const probeTargets = useCallback((targets: MirrorConfig[]) => {
    if (targets.length === 0) return;
    setSpeedResults(prev => [...prev, ...pendingResults(targets)]);
    void probeAllMirrors(targets, {
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
  }, []);

  const runSpeedTest = useCallback(async () => {
    const list = mirrorsRef.current;
    setIsTesting(true);
    setSpeedResults(pendingResults(list));
    await probeAllMirrors(list, {
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
  }, []);

  // 进入下载页即自动测速：每个访客用自己的网络得到真实结果
  useEffect(() => {
    void runSpeedTest();
  }, [runSpeedTest]);

  // 运行时镜像自动发现：经 CORS 代理抓取聚合站，24 小时会话缓存
  useEffect(() => {
    let alive = true;
    discoverRuntimeMirrors()
      .then(hosts => {
        if (!alive || hosts.length === 0) return;
        const before = mirrorsRef.current;
        const merged = mergeDiscoveredMirrors(before, hosts);
        if (merged === before) return;
        mirrorsRef.current = merged;
        setMirrors(merged);
        setDiscoveredCount(merged.length - before.length);
        const known = new Set(before.map(m => m.id));
        probeTargets(merged.filter(m => !known.has(m.id)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [probeTargets]);

  // 拉取最近发布（含旧版本），供版本切换与更新说明展示
  useEffect(() => {
    let alive = true;
    fetchReleases(10)
      .then(list => {
        if (!alive) return;
        setReleases(list);
        setSelectedTag(list[0]?.tag_name ?? null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setReleasesError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, []);

  const best = bestMirrorId(speedResults);
  const selectedRelease =
    releases?.find(release => release.tag_name === selectedTag) ??
    releases?.[0] ??
    null;

  return (
    <Layout
      title="软件下载"
      description="LX-M Music 桌面版下载 - 自动发现多个加速镜像，基于您的网络实测并预选最快节点，支持历史版本下载">
      <main className={styles.page}>
        <div className={styles.hero}>
          <MediaBackdrop
            className={styles.heroBackdrop}
            sources={[
              {kind: 'image', url: MOEZ_IMAGE},
              {kind: 'image', url: YCY_IMAGE},
            ]}
          />
          <div className="container">
            <Heading as="h1" className={styles.title}>
              软件下载
            </Heading>
            <p className={styles.subtitle}>
              自动发现可用加速镜像，进入页面即按您的网络实测，自动预选最快节点
            </p>
          </div>
        </div>

        <div className="container">
          {/* 版本选择 + 更新说明 */}
          <div className={styles.releasePanel}>
            <div className={styles.releaseHeader}>
              <div className={styles.releaseSelector}>
                <label htmlFor="release-select">选择版本</label>
                <select
                  id="release-select"
                  className={styles.releaseSelect}
                  value={selectedTag ?? ''}
                  onChange={event => setSelectedTag(event.target.value)}
                  disabled={!releases}>
                  {(releases ?? []).map((release, idx) => (
                    <option key={release.tag_name} value={release.tag_name}>
                      {release.tag_name}
                      {idx === 0 ? '（最新）' : ''}
                      {release.prerelease ? '（预发布）' : ''}
                      {` · ${formatDate(release.published_at)}`}
                    </option>
                  ))}
                  {!releases && <option value="">正在获取版本…</option>}
                </select>
              </div>
              {selectedRelease && (
                <div className={styles.releaseMeta}>
                  {selectedRelease.prerelease && (
                    <span className={styles.preTag}>预发布</span>
                  )}
                  <span className={styles.releaseDate}>
                    发布于 {formatDate(selectedRelease.published_at)}
                  </span>
                  <a
                    href={selectedRelease.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.releaseLink}>
                    Release 详情
                  </a>
                </div>
              )}
            </div>
            {selectedRelease && (
              <div
                className={`${styles.releaseNotes} markdown`}
                // 内容来自官方 GitHub Release 页，已去除 script 标签
                dangerouslySetInnerHTML={{
                  __html: renderReleaseNotes(selectedRelease.body ?? ''),
                }}
              />
            )}
            {!selectedRelease && !releasesError && (
              <div className={styles.notesEmpty}>正在获取更新说明…</div>
            )}
          </div>

          {releasesError && (
            <div className={styles.errorBox}>
              <p>获取版本信息失败：{releasesError}</p>
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

          <SpeedTestPanel
            mirrors={mirrors}
            results={speedResults}
            isTesting={isTesting}
            bestId={best}
            discoveredCount={discoveredCount}
            onRetest={() => void runSpeedTest()}
          />

          {!releasesError && (
            <div className={styles.platformsGrid}>
              {PLATFORMS.map(platform => (
                <DownloadCard
                  key={platform.id}
                  platform={platform}
                  release={selectedRelease}
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
            <h2>安装说明</h2>
            <div className={styles.guideGrid}>
              {INSTALL_GUIDE.map(section => (
                <div key={section.title} className={styles.guideCard}>
                  <h3>
                    <img
                      src={section.iconSrc}
                      alt=""
                      className={styles.guideIcon}
                      loading="lazy"
                    />
                    {section.title}
                  </h3>
                  <ul>
                    {section.items.map(item => (
                      <li key={item.label}>
                        <strong>{item.label}</strong>：{item.description}
                      </li>
                    ))}
                  </ul>
                  {section.note && (
                    <p className={styles.guideNote}>{section.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.safetyNotice}>
            <h3>安全提示</h3>
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
