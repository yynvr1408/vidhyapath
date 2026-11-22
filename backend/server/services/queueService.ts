// Enterprise High-Concurrency Batch Queue & Event Deduplicator Service
import { insertSyncEvent, isNeonConnected } from '../db/neon.js';
import { dataStore } from '../db/store.js';

export interface QueuedSyncEvent {
  eventId: string;
  learnerId: string;
  questionId: string;
  skillId: string;
  chosenAnswer: string;
  correct: boolean;
  hintsUsed: number;
  timeMs: number;
  inputMode: string;
  ts: number;
}

class EventBatchQueueService {
  private queue: QueuedSyncEvent[] = [];
  private processedEventIds = new Set<string>();
  private isFlushing = false;
  private totalProcessed = 0;
  private totalErrors = 0;

  constructor() {
    // Process queue every 1.5 seconds or when threshold reached
    setInterval(() => {
      this.flushBatch();
    }, 1500);
  }

  // Enqueue event with O(1) deduplication check
  enqueue(event: QueuedSyncEvent): { queued: boolean; duplicate: boolean } {
    if (this.processedEventIds.has(event.eventId)) {
      return { queued: false, duplicate: true };
    }

    this.processedEventIds.add(event.eventId);
    this.queue.push(event);

    // If memory set gets too large, keep the last 50,000 processed IDs
    if (this.processedEventIds.size > 50000) {
      const iter = this.processedEventIds.values();
      for (let i = 0; i < 10000; i++) {
        const val = iter.next().value;
        if (val) this.processedEventIds.delete(val);
      }
    }

    if (this.queue.length >= 50) {
      this.flushBatch();
    }

    return { queued: true, duplicate: false };
  }

  // Flush in batches
  async flushBatch() {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    const batch = this.queue.splice(0, 50);

    try {
      if (isNeonConnected()) {
        for (const ev of batch) {
          await insertSyncEvent(ev);
        }
      }
      this.totalProcessed += batch.length;
    } catch (err) {
      console.error('[Batch Queue] Error flushing sync batch:', err);
      this.totalErrors += batch.length;
    } finally {
      this.isFlushing = false;
    }
  }

  getMetrics() {
    return {
      pendingQueueLength: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalErrors: this.totalErrors,
      uniqueDedupedIdsCached: this.processedEventIds.size,
    };
  }
}

export const eventQueueService = new EventBatchQueueService();
