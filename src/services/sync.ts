import { localDb } from '../db/indexedDb';
import { API_BASE } from '../config/api';
import { SyncPayload, SyncResponse, DoubtItem } from '../types';

export class SyncService {
  private static isSyncing = false;

  /**
   * Syncs pending outbox attempt events and queued doubts with the server
   */
  public static async syncOutbox(
    learnerId: string,
    currentPackVersion: string = '1.0.0'
  ): Promise<{ syncedEventsCount: number; answeredDoubts: DoubtItem[]; hasUpdate: boolean }> {
    if (this.isSyncing) {
      return { syncedEventsCount: 0, answeredDoubts: [], hasUpdate: false };
    }

    if (!navigator.onLine) {
      return { syncedEventsCount: 0, answeredDoubts: [], hasUpdate: false };
    }

    this.isSyncing = true;
    try {
      const pendingAttempts = await localDb.getOutboxAttempts();
      const learnerDoubts = await localDb.getDoubtsByLearner(learnerId);
      const queuedDoubts = learnerDoubts.filter((d) => d.status === 'queued');

      if (pendingAttempts.length === 0 && queuedDoubts.length === 0) {
        this.isSyncing = false;
        return { syncedEventsCount: 0, answeredDoubts: [], hasUpdate: false };
      }

      const payload: SyncPayload = {
        learnerId,
        events: pendingAttempts,
        doubts: queuedDoubts,
        clientPackVersion: currentPackVersion,
      };

      const res = await fetch(API_BASE + '/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: SyncResponse = await res.json();

        // 1. Clear synced attempts from outbox
        if (pendingAttempts.length > 0) {
          const syncedIds = pendingAttempts.map((e) => e.eventId);
          await localDb.clearOutboxAttempts(syncedIds);
        }

        // 2. Mark answered doubts
        if (data.answeredDoubts && data.answeredDoubts.length > 0) {
          for (const d of data.answeredDoubts) {
            await localDb.saveDoubt({
              ...d,
              status: 'answered',
            });
          }
        }

        this.isSyncing = false;
        return {
          syncedEventsCount: data.syncedEventsCount || pendingAttempts.length,
          answeredDoubts: data.answeredDoubts || [],
          hasUpdate: data.packUpdateAvailable || false,
        };
      }
    } catch (err) {
      console.warn('Sync outbox failed (offline or network delay):', err);
    } finally {
      this.isSyncing = false;
    }

    return { syncedEventsCount: 0, answeredDoubts: [], hasUpdate: false };
  }
}
