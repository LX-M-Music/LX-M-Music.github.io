import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {useState, useEffect, useCallback, useRef} from 'react';
import styles from './download.module.css';

// GitHub Release API 配置
const GITHUB_OWNER = 'Miao-moe';
const GITHUB_REPO = 'lx-m_lx-Miao-moe-music-desktop';

// 镜像站点配置
interface MirrorConfig {
  id: string;
  name: string;
  description: string;
  urlTemplate: string; // {owner}/{repo}/releases/download/{tag}/{filename}
  testUrl: string;
  enabled: boolean;
}

const MIRRORS: MirrorConfig[] = [
  {
    id: 'github',
    name: 'GitHub 官方',
    description: '原始发布地址，海外用户首选',
    urlTemplate: 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://github.com',
    enabled: true,
  },
  {
    id: 'ghproxy',
    name: 'GHProxy',
    description: 'ghproxy.cc 镜像，国内访问较快',
    urlTemplate: 'https://ghproxy.cc/https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://ghproxy.cc',
    enabled: true,
  },
  {
    id: 'ghps',
    name: 'GHPS',
    description: 'ghps.cc 镜像，稳定可靠',
    urlTemplate: 'https://ghps.cc/https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://ghps.cc',
    enabled: true,
  },
  {
    id: 'ghfast',
    name: 'GHFast',
    description: 'ghfast.top 镜像，速度优秀',
    urlTemplate: 'https://ghfast.top/https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://ghfast.top',
    enabled: true,
  },
  {
    id: 'mirrorgh',
    name: 'Mirror.gh',
    description: 'mirror.ghproxy.com 镜像',
    urlTemplate: 'https://mirror.ghproxy.com/https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://mirror.ghproxy.com',
    enabled: true,
  },
  {
    id: 'ghproxy_moe',
    name: 'GHProxy Moe',
    description: 'ghproxy.moe 镜像，咕咕维护',
    urlTemplate: 'https://ghproxy.moe/https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}',
    testUrl: 'https://ghproxy.moe',
    enabled: true,
  },
];

// 平台配置
interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  filePatterns: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'windows',
    name: 'Windows',
    icon: '🪟',
    description: 'Windows 10 / 11（推荐）/ Windows 7（兼容版）',
    filePatterns: ['win_x64 Setup.exe', 'win_x64 green.7z', 'win7_x64 green.7z'],
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: '🍎',
    description: 'macOS 10.15+（Intel & Apple Silicon）',
    filePatterns: ['mac.dmg', 'mac_x64.dmg', 'mac_arm64.dmg'],
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: '🐧',
    description: 'Linux（deb / rpm / AppImage / pacman）',
    filePatterns: ['linux_x64.deb', 'linux_x64.rpm', 'linux_x64.AppImage', 'linux_x64.pacman'],
  },
];

interface SpeedResult {
  mirrorId: string;
  latency: number;
  status: 'pending' | 'testing' | 'done' | 'error';
  speed?: string;
}

interface ReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    size: number;
    browser_download_url: string;
    download_count: number;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function MirrorSpeedTester({ onComplete, isTesting }: { onComplete: (results: SpeedResult[]) => void; isTesting: boolean }) {
  const [results, setResults] = useState<SpeedResult[]>(
    MIRRORS.map(m => ({ mirrorId: m.id, latency: 0, status: 'pending' }))
  );
  const abortRef = useRef<AbortController | null>(null);

  const testMirror = useCallback(async (mirror: MirrorConfig, index: number) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, status: 'testing' } : r));

    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(mirror.testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);

      let speed: string;
      if (latency < 500) speed = '极快';
      else if (latency < 1500) speed = '很快';
      else if (latency < 3000) speed = '一般';
      else speed = '较慢';

      setResults(prev => prev.map((r, i) => i === index ? { ...r, latency, status: 'done', speed } : r));
      return { mirrorId: mirror.id, latency, status: 'done' as const, speed };
    } catch {
      clearTimeout(timeout);
      setResults(prev => prev.map((r, i) => i === index ? { ...r, latency: 99999, status: 'error', speed: '超时' } : r));
      return { mirrorId: mirror.id, latency: 99999, status: 'error' as const, speed: '超时' };
    }
  }, []);

  const startTest = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setResults(MIRRORS.map(m => ({ mirrorId: m.id, latency: 0, status: 'pending' })));

    const allResults: SpeedResult[] = [];
    for (let i = 0; i < MIRRORS.length; i++) {
      if (abortRef.current.signal.aborted) break;
      const result = await testMirror(MIRRORS[i], i);
      allResults.push(result);
    }

    onComplete(allResults);
  }, [testMirror, onComplete]);

  useEffect(() => {
    if (isTesting) {
      startTest();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [isTesting, startTest]);

  const getBadgeClass = (result: SpeedResult) => {
    if (result.status === 'pending') return 'mirror-badge--testing';
    if (result.status === 'testing') return 'mirror-badge--testing';
    if (result.status === 'error') return 'mirror-badge--slow';
    if (result.latency < 1500) return 'mirror-badge--fast';
    if (result.latency < 3000) return 'mirror-badge--medium';
    return 'mirror-badge--slow';
  };

  return (
    <div className={styles.speedTestPanel}>
      <div className={styles.speedTestHeader}>
        <h3>🚀 镜像速度测试</h3>
        <p>自动测试各镜像站点的响应速度，为您推荐最优下载链路</p>
      </div>
      <div className={styles.mirrorList}>
        {MIRRORS.map((mirror, idx) => {
          const result = results[idx];
          return (
            <div key={mirror.id} className={styles.mirrorItem}>
              <div className={styles.mirrorInfo}>
                <span className={styles.mirrorName}>{mirror.name}</span>
                <span className={styles.mirrorDesc}>{mirror.description}</span>
              </div>
              <div className={styles.mirrorStatus}>
                {result.status === 'pending' && (
                  <span className={`mirror-badge mirror-badge--testing`}>⏳ 等待测试</span>
                )}
                {result.status === 'testing' && (
                  <span className={`mirror-badge mirror-badge--testing`}>🔄 测试中...</span>
                )}
                {result.status === 'done' && (
                  <span className={`mirror-badge ${getBadgeClass(result)}`}>
                    {result.latency < 500 ? '⚡' : result.latency < 1500 ? '✅' : '⏱️'} {result.latency}ms · {result.speed}
                  </span>
                )}
                {result.status === 'error' && (
                  <span className={`mirror-badge mirror-badge--slow`}>❌ 连接失败</span>
                )}
              </div>
              {result.status === 'testing' && (
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{width: '60%', animation: 'progress-pulse 1s ease-in-out infinite'}}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DownloadCard({ 
  platform, 
  release, 
  bestMirror, 
  speedResults 
}: { 
  platform: PlatformConfig; 
  release: ReleaseInfo | null;
  bestMirror: MirrorConfig | null;
  speedResults: SpeedResult[];
}) {
  const [selectedMirror, setSelectedMirror] = useState<string>(bestMirror?.id || 'github');

  if (!release) {
    return (
      <div className={`download-card ${styles.platformCard}`}>
        <div className={styles.platformHeader}>
          <span className={styles.platformIcon}>{platform.icon}</span>
          <div>
            <h3>{platform.name}</h3>
            <p>{platform.description}</p>
          </div>
        </div>
        <div style={{textAlign: 'center', padding: '2rem', color: 'var(--ifm-color-emphasis-600)'}}>
          ⏳ 正在获取版本信息...
        </div>
      </div>
    );
  }

  const assets = release.assets.filter(a => 
    platform.filePatterns.some(p => a.name.toLowerCase().includes(p.toLowerCase().replace('*', '')))
  );

  const getDownloadUrl = (filename: string) => {
    const mirror = MIRRORS.find(m => m.id === selectedMirror) || MIRRORS[0];
    return mirror.urlTemplate
      .replace('{owner}', GITHUB_OWNER)
      .replace('{repo}', GITHUB_REPO)
      .replace('{tag}', release.tag_name)
      .replace('{filename}', filename);
  };

  const mirrorResult = speedResults.find(r => r.mirrorId === selectedMirror);

  return (
    <div className={`download-card ${styles.platformCard}`}>
      <div className={styles.platformHeader}>
        <span className={styles.platformIcon}>{platform.icon}</span>
        <div>
          <h3>{platform.name}</h3>
          <p>{platform.description}</p>
        </div>
      </div>

      <div className={styles.mirrorSelector}>
        <label>选择下载镜像：</label>
        <select 
          value={selectedMirror} 
          onChange={(e) => setSelectedMirror(e.target.value)}
          className={styles.mirrorSelect}
        >
          {MIRRORS.map(mirror => {
            const result = speedResults.find(r => r.mirrorId === mirror.id);
            const label = result?.status === 'done' 
              ? `${mirror.name} (${result.latency}ms)`
              : result?.status === 'error'
              ? `${mirror.name} (不可用)`
              : mirror.name;
            return (
              <option key={mirror.id} value={mirror.id}>
                {label}
              </option>
            );
          })}
        </select>
        {mirrorResult?.status === 'done' && (
          <span className={`mirror-badge ${mirrorResult.latency < 1500 ? 'mirror-badge--fast' : mirrorResult.latency < 3000 ? 'mirror-badge--medium' : 'mirror-badge--slow'}`}>
            {mirrorResult.latency}ms
          </span>
        )}
      </div>

      <div className={styles.fileList}>
        {assets.length === 0 ? (
          <div style={{color: 'var(--ifm-color-emphasis-600)', padding: '1rem 0'}}>
            暂无该平台安装包
          </div>
        ) : (
          assets.map(asset => (
            <div key={asset.name} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{asset.name}</span>
                <span className={styles.fileMeta}>{formatBytes(asset.size)} · {asset.download_count} 次下载</span>
              </div>
              <a 
                href={getDownloadUrl(asset.name)}
                className="button button--primary button--sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                ⬇️ 下载
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DownloadPage(): ReactNode {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [speedResults, setSpeedResults] = useState<SpeedResult[]>([]);
  const [bestMirror, setBestMirror] = useState<MirrorConfig | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRelease(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleTestComplete = useCallback((results: SpeedResult[]) => {
    setSpeedResults(results);
    const validResults = results.filter(r => r.status === 'done');
    if (validResults.length > 0) {
      const best = validResults.reduce((a, b) => a.latency < b.latency ? a : b);
      const bestMirrorConfig = MIRRORS.find(m => m.id === best.mirrorId);
      setBestMirror(bestMirrorConfig || null);
    }
    setIsTesting(false);
  }, []);

  const startSpeedTest = () => {
    setIsTesting(true);
  };

  return (
    <Layout
      title="软件下载"
      description="LX-M Music 桌面版下载 - 支持多镜像链路测速，自动选择最优下载地址">
      <main className={styles.downloadPage}>
        <div className={styles.downloadHero}>
          <div className="container">
            <Heading as="h1" className={styles.downloadTitle}>⬇️ 软件下载</Heading>
            <p className={styles.downloadSubtitle}>
              选择您的平台，我们将自动测试各镜像站点的下载速度，为您推荐最优下载链路
            </p>
          </div>
        </div>

        <div className="container">
          {/* 版本信息 */}
          {release && (
            <div className={styles.versionInfo}>
              <div className={styles.versionBadge}>
                <span className={styles.versionTag}>📦 {release.tag_name}</span>
                <span className={styles.versionDate}>发布于 {formatDate(release.published_at)}</span>
              </div>
              <a 
                href={release.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.releaseLink}
              >
                查看 Release 详情 →
              </a>
            </div>
          )}

          {/* 速度测试面板 */}
          <div className={styles.testSection}>
            <MirrorSpeedTester 
              onComplete={handleTestComplete} 
              isTesting={isTesting} 
            />
            <div className={styles.testActions}>
              <button 
                className="button button--primary"
                onClick={startSpeedTest}
                disabled={isTesting}
              >
                {isTesting ? '🔄 测试中...' : speedResults.length > 0 ? '🔄 重新测试' : '🚀 开始测速'}
              </button>
              {bestMirror && !isTesting && (
                <span className={styles.bestMirrorTag}>
                  🏆 推荐镜像：<strong>{bestMirror.name}</strong>（{speedResults.find(r => r.mirrorId === bestMirror.id)?.latency}ms）
                </span>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className={styles.errorBox}>
              <p>⚠️ 获取版本信息失败：{error}</p>
              <p>您可以尝试直接访问 GitHub Release 页面下载：</p>
              <a 
                href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--primary"
              >
                前往 GitHub Release
              </a>
            </div>
          )}

          {/* 平台下载卡片 */}
          {!error && (
            <div className={styles.platformsGrid}>
              {PLATFORMS.map(platform => (
                <DownloadCard 
                  key={platform.id}
                  platform={platform}
                  release={release}
                  bestMirror={bestMirror}
                  speedResults={speedResults}
                />
              ))}
            </div>
          )}

          {/* 安装说明 */}
          <div className={styles.installGuide}>
            <h2>📋 安装说明</h2>
            <div className={styles.guideGrid}>
              <div className={styles.guideCard}>
                <h3>🪟 Windows</h3>
                <ul>
                  <li><strong>Setup.exe</strong>：安装版，支持自动更新</li>
                  <li><strong>green.7z</strong>：免安装版，解压即用</li>
                  <li><strong>win7</strong>：兼容 Windows 7/8/8.1 的版本</li>
                  <li>带 <code>x64</code> 为 64 位，<code>x86</code> 为 32 位</li>
                </ul>
              </div>
              <div className={styles.guideCard}>
                <h3>🍎 macOS</h3>
                <ul>
                  <li><strong>.dmg</strong>：通用安装包</li>
                  <li><strong>x64</strong>：Intel 芯片 Mac</li>
                  <li><strong>arm64</strong>：Apple Silicon Mac (M1/M2/M3)</li>
                  <li>拖拽到 Applications 文件夹即可</li>
                </ul>
              </div>
              <div className={styles.guideCard}>
                <h3>🐧 Linux</h3>
                <ul>
                  <li><strong>.deb</strong>：Debian / Ubuntu 系</li>
                  <li><strong>.rpm</strong>：Fedora / RHEL 系</li>
                  <li><strong>.AppImage</strong>：通用格式，无需安装</li>
                  <li><strong>.pacman</strong>：Arch Linux 系</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className={styles.safetyNotice}>
            <h3>🛡️ 安全提示</h3>
            <p>
              如果杀毒软件报毒，请先确认软件是从本页面或 
              <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer">
                GitHub Release
              </a>
              下载的。确认为官方渠道下载后，大概率是误报。
            </p>
            <p style={{marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)'}}>
              我们不对第三方渠道下载的安全性作任何保证。
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
