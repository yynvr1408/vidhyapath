// App Update Manager Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateManager } from '../../src/services/updateManager';
import { APP_VERSION } from '../../src/config/version';

describe('App Update System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports current app version accurately', () => {
    const state = updateManager.getState();
    expect(state.currentVersion).toBe(APP_VERSION);
  });

  it('toggles modal open and close state', () => {
    updateManager.openModal();
    expect(updateManager.getState().isModalOpen).toBe(true);

    updateManager.closeModal();
    expect(updateManager.getState().isModalOpen).toBe(false);
  });

  it('toggles banner dismiss state', () => {
    updateManager.dismissBanner();
    expect(updateManager.getState().bannerDismissed).toBe(true);
  });

  it('detects PWA update when vidyapath-pwa-update-available event is dispatched', () => {
    window.dispatchEvent(new CustomEvent('vidyapath-pwa-update-available'));
    expect(updateManager.getState().isPwaUpdateAvailable).toBe(true);
    expect(updateManager.getState().hasUpdate).toBe(true);
  });

  it('parses server update response and flags when a newer version is released', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hasUpdate: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
        downloadUrl: 'https://github.com/yynvr1408/vidhyapath/releases/download/v1.1.0/vidyapath.apk',
        releaseNotes: 'Performance optimizations and new features',
        apkSizeMb: '4.8 MB',
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const info = await updateManager.checkForUpdates(true);
    expect(info).not.toBeNull();
    expect(info?.hasUpdate).toBe(true);
    expect(info?.latestVersion).toBe('1.1.0');
    expect(updateManager.getState().hasUpdate).toBe(true);
  });
});
