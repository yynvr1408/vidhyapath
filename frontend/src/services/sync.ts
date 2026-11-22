import { localDb } from '../db/indexedDb';
import { SyncPayload, SyncResponse, DoubtItem } from '../types';

export interface SyncResult {
  syncedEventsCount: number;
  answeredDoubts: DoubtItem[];
  hasUpdate: boolean;
}

const EMPTY_RESULT: SyncResult = { syncedEventsCount: 0, answeredDoubts: [], hasUpdate: false };

export class SyncService {
  private static inFlight = new Map<string, Promise<SyncResult>>();

  /** Sync one learner's pending work. Different profiles can sync independently. */
  public static syncOutbox(
    learnerId: string,
    currentPackVersion: string = '1.0.0',
    language: 'te' | 'hi' | 'en' = 'te'
  ): Promise<SyncResult> {
    const activeSync = this.inFlight.get(learnerId);
    if (activeSync) return activeSync;

    const sync = this.performSync(learnerId, currentPackVersion, language).finally(() => {
      this.inFlight.delete(learnerId);
    });
    this.inFlight.set(learnerId, sync);
    return sync;
  }

  private static async performSync(
    learnerId: string,
    currentPackVersion: string,
    language: 'te' | 'hi' | 'en'
  ): Promise<SyncResult> {
    if (!navigator.onLine) return EMPTY_RESULT;

    try {
      // Filter by owner on both the database query and the payload boundary.
      const [storedAttempts, learnerDoubts] = await Promise.all([
        localDb.getOutboxAttempts(learnerId),
        localDb.getDoubtsByLearner(learnerId),
      ]);
      const pendingAttempts = storedAttempts.filter((event) => event.learnerId === learnerId);
      const queuedDoubts = learnerDoubts.filter(
        (doubt) => doubt.learnerId === learnerId && doubt.status === 'queued'
      );

      if (pendingAttempts.length === 0 && queuedDoubts.length === 0) return EMPTY_RESULT;

      const payload: SyncPayload = {
        learnerId,
        events: pendingAttempts,
        doubts: queuedDoubts,
        clientPackVersion: currentPackVersion,
        language,
      };

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('vidyapath_token')
            ? { Authorization: `Bearer ${localStorage.getItem('vidyapath_token')}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return EMPTY_RESULT;

      const data = (await response.json()) as SyncResponse;
      if (!data.success) return EMPTY_RESULT;
      // Do not discard the browser outbox when the API only accepted work into
      // its process-local development fallback.
      if (data.durable !== true) return { ...EMPTY_RESULT, hasUpdate: Boolean(data.packUpdateAvailable) };

      // Only remove rows the server explicitly accepted, and never accept an ID
      // that was not included in this learner's request.
      const submittedIds = new Set(pendingAttempts.map((event) => event.eventId));
      const syncedIds = Array.isArray(data.syncedEventIds)
        ? data.syncedEventIds.filter((eventId) => submittedIds.has(eventId))
        : [];
      if (syncedIds.length > 0) await localDb.clearOutboxAttempts(syncedIds);

      const submittedDoubtIds = new Set(queuedDoubts.map((doubt) => doubt.id));
      const answeredDoubts = Array.isArray(data.answeredDoubts)
        ? data.answeredDoubts.filter(
            (doubt) => doubt.learnerId === learnerId && submittedDoubtIds.has(doubt.id)
          )
        : [];
      for (const doubt of answeredDoubts) {
        await localDb.saveDoubt({ ...doubt, status: 'answered' });
      }

      return {
        syncedEventsCount: syncedIds.length,
        answeredDoubts,
        hasUpdate: Boolean(data.packUpdateAvailable),
      };
    } catch (err) {
      console.warn('Sync outbox failed (offline or network delay):', err);
      return EMPTY_RESULT;
    }
  }
}
