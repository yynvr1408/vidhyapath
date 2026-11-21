import { LearnerProfile, AttemptEvent, SkillState, DoubtItem } from '../types';

const DB_NAME = 'Vidyapath_DB';
const DB_VERSION = 1;

export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Learners store
        if (!db.objectStoreNames.contains('learners')) {
          db.createObjectStore('learners', { keyPath: 'id' });
        }

        // Attempt events store (append-only)
        if (!db.objectStoreNames.contains('attempts')) {
          const attemptStore = db.createObjectStore('attempts', { keyPath: 'eventId' });
          attemptStore.createIndex('learnerId', 'learnerId', { unique: false });
          attemptStore.createIndex('skillId', 'skillId', { unique: false });
        }

        // Skill states (derived)
        if (!db.objectStoreNames.contains('skill_states')) {
          db.createObjectStore('skill_states', { keyPath: ['learnerId', 'skillId'] });
        }

        // Sync Outbox
        if (!db.objectStoreNames.contains('outbox_sync')) {
          db.createObjectStore('outbox_sync', { keyPath: 'eventId' });
        }

        // Doubts
        if (!db.objectStoreNames.contains('doubts')) {
          const doubtStore = db.createObjectStore('doubts', { keyPath: 'id' });
          doubtStore.createIndex('learnerId', 'learnerId', { unique: false });
          doubtStore.createIndex('status', 'status', { unique: false });
        }

        // Tutor Cache
        if (!db.objectStoreNames.contains('tutor_cache')) {
          db.createObjectStore('tutor_cache', { keyPath: 'queryKey' });
        }

        // Key-Value App Settings
        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        reject((e.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  // --- Learners ---
  async getLearners(): Promise<LearnerProfile[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('learners', 'readonly');
      const store = tx.objectStore('learners');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveLearner(learner: LearnerProfile): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('learners', 'readwrite');
      const store = tx.objectStore('learners');
      const req = store.put(learner);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteLearner(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('learners', 'readwrite');
      const store = tx.objectStore('learners');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getLearnerById(id: string): Promise<LearnerProfile | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('learners', 'readonly');
      const store = tx.objectStore('learners');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async findLearnerByLoginCode(code: string): Promise<LearnerProfile | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;
    const all = await this.getLearners();
    return all.find((l) => (l.loginCode || '').trim().toUpperCase() === cleanCode) || null;
  }

  async isLoginCodeTaken(code: string, excludeId?: string): Promise<boolean> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;
    const all = await this.getLearners();
    return all.some((l) => l.id !== excludeId && (l.loginCode || '').trim().toUpperCase() === cleanCode);
  }

  // --- Attempts & Sync ---
  async recordAttempt(event: AttemptEvent): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['attempts', 'outbox_sync'], 'readwrite');
      const attemptsStore = tx.objectStore('attempts');
      const outboxStore = tx.objectStore('outbox_sync');

      attemptsStore.put(event);
      outboxStore.put(event);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAttemptsByLearner(learnerId: string): Promise<AttemptEvent[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attempts', 'readonly');
      const store = tx.objectStore('attempts');
      const index = store.index('learnerId');
      const req = index.getAll(learnerId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getOutboxAttempts(): Promise<AttemptEvent[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox_sync', 'readonly');
      const store = tx.objectStore('outbox_sync');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async clearOutboxAttempts(eventIds: string[]): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox_sync', 'readwrite');
      const store = tx.objectStore('outbox_sync');
      for (const id of eventIds) {
        store.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Skill State (Adaptive engine cache) ---
  async getSkillState(learnerId: string, skillId: string): Promise<SkillState | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('skill_states', 'readonly');
      const store = tx.objectStore('skill_states');
      const req = store.get([learnerId, skillId]);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSkillStates(learnerId: string): Promise<SkillState[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('skill_states', 'readonly');
      const store = tx.objectStore('skill_states');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: SkillState[] = req.result || [];
        resolve(all.filter((s) => s.learnerId === learnerId));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSkillState(state: SkillState): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('skill_states', 'readwrite');
      const store = tx.objectStore('skill_states');
      const req = store.put(state);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Doubts ---
  async saveDoubt(doubt: DoubtItem): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('doubts', 'readwrite');
      const store = tx.objectStore('doubts');
      const req = store.put(doubt);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getDoubtsByLearner(learnerId: string): Promise<DoubtItem[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('doubts', 'readonly');
      const store = tx.objectStore('doubts');
      const index = store.index('learnerId');
      const req = index.getAll(learnerId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getQueuedDoubtsCount(learnerId?: string): Promise<number> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('doubts', 'readonly');
      const store = tx.objectStore('doubts');
      const index = store.index('status');
      const req = index.getAll('queued');
      req.onsuccess = () => {
        const items: DoubtItem[] = req.result || [];
        if (learnerId) {
          resolve(items.filter((d) => d.learnerId === learnerId).length);
        } else {
          resolve(items.length);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- Tutor Cache ---
  async getTutorCachedReply(queryKey: string): Promise<string | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tutor_cache', 'readonly');
      const store = tx.objectStore('tutor_cache');
      const req = store.get(queryKey);
      req.onsuccess = () => resolve(req.result ? req.result.reply : null);
      req.onerror = () => reject(req.error);
    });
  }

  async setTutorCachedReply(queryKey: string, reply: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tutor_cache', 'readwrite');
      const store = tx.objectStore('tutor_cache');
      const req = store.put({ queryKey, reply, ts: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearTutorCache(): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tutor_cache', 'readwrite');
      const store = tx.objectStore('tutor_cache');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Settings ---
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const db = await this.getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('app_settings', 'readonly');
      const store = tx.objectStore('app_settings');
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined && req.result.value !== undefined) {
          resolve(req.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_settings', 'readwrite');
      const store = tx.objectStore('app_settings');
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const localDb = new LocalDatabase();
