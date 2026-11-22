// Global App Update Manager for Web PWA and Native Android APK
import { APP_VERSION } from '../config/version';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  apkSizeMb?: string;
  publishedAt?: string;
}

type UpdateListener = () => void;

class UpdateManager {
  private static instance: UpdateManager;
  private currentVersion = APP_VERSION;
  private updateInfo: UpdateInfo | null = null;
  private isChecking = false;
  private isPwaUpdateAvailable = false;
  private error: string | null = null;
  private isModalOpen = false;
  private bannerDismissed = false;
  private listeners: Set<UpdateListener> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      // Listen for custom Service Worker PWA update event from index.html
      window.addEventListener('vidyapath-pwa-update-available', () => {
        this.isPwaUpdateAvailable = true;
        this.notifyListeners();
      });

      // Periodic check every 15 minutes when online
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.checkForUpdates(false).catch(() => {});
        }
      }, 15 * 60 * 1000);
    }
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public getState() {
    return {
      currentVersion: this.currentVersion,
      updateInfo: this.updateInfo,
      isChecking: this.isChecking,
      isPwaUpdateAvailable: this.isPwaUpdateAvailable,
      hasUpdate: Boolean(this.updateInfo?.hasUpdate || this.isPwaUpdateAvailable),
      error: this.error,
      isModalOpen: this.isModalOpen,
      bannerDismissed: this.bannerDismissed,
    };
  }

  public openModal() {
    this.isModalOpen = true;
    this.notifyListeners();
  }

  public closeModal() {
    this.isModalOpen = false;
    this.notifyListeners();
  }

  public dismissBanner() {
    this.bannerDismissed = true;
    this.notifyListeners();
  }

  public async checkForUpdates(force = true): Promise<UpdateInfo | null> {
    this.isChecking = true;
    this.error = null;
    this.notifyListeners();

    try {
      // 1. Check backend /api/app/check-update endpoint
      const res = await fetch(`/api/app/check-update?currentVersion=${encodeURIComponent(this.currentVersion)}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data: UpdateInfo = await res.json();
        this.updateInfo = data;
        this.isChecking = false;
        this.notifyListeners();
        return data;
      }
      throw new Error(`Server returned status ${res.status}`);
    } catch {
      // 2. Direct GitHub Releases fallback if backend is offline or standalone
      try {
        const ghRes = await fetch('https://api.github.com/repos/yynvr1408/vidhyapath/releases/latest', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (ghRes.ok) {
          const release = await ghRes.json();
          const latest = (release.tag_name || '').replace(/^v/, '');
          const apk = release.assets?.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));

          const parseVer = (v: string) => v.replace(/^[^0-9]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
          const [lMaj = 0, lMin = 0, lPatch = 0] = parseVer(latest);
          const [cMaj = 0, cMin = 0, cPatch = 0] = parseVer(this.currentVersion);
          const isNewer =
            lMaj > cMaj ||
            (lMaj === cMaj && lMin > cMin) ||
            (lMaj === cMaj && lMin === cMin && lPatch > cPatch);

          const info: UpdateInfo = {
            hasUpdate: isNewer,
            latestVersion: latest,
            downloadUrl: apk ? apk.browser_download_url : release.html_url,
            releaseNotes: release.body || '',
            apkSizeMb: apk?.size ? (apk.size / (1024 * 1024)).toFixed(1) + ' MB' : undefined,
            publishedAt: release.published_at,
          };
          this.updateInfo = info;
          this.isChecking = false;
          this.notifyListeners();
          return info;
        }
      } catch (ghErr) {
        console.warn('Direct GitHub releases check failed:', ghErr);
      }

      this.error = 'Failed to check updates';
    } finally {
      this.isChecking = false;
      this.notifyListeners();
    }

    return null;
  }

  public applyPwaUpdate() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
}

export const updateManager = UpdateManager.getInstance();
