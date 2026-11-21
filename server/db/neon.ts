import pkg from 'pg';
const { Pool } = pkg;

let poolInstance: any = null;

export function getPool() {
  if (!poolInstance && process.env.DATABASE_URL) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return poolInstance;
}

let isConnected = false;

export async function initNeonDb(): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    console.log('[Neon DB] No DATABASE_URL set. Running in local fallback mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_events (
          event_id VARCHAR(64) PRIMARY KEY,
          learner_id VARCHAR(64) NOT NULL,
          question_id VARCHAR(64) NOT NULL,
          skill_id VARCHAR(64) NOT NULL,
          chosen_answer VARCHAR(16),
          correct BOOLEAN NOT NULL,
          hints_used INT DEFAULT 0,
          time_ms INT DEFAULT 0,
          input_mode VARCHAR(16) DEFAULT 'tap',
          receipt_hash VARCHAR(64),
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doubts_queue (
          id VARCHAR(64) PRIMARY KEY,
          learner_id VARCHAR(64) NOT NULL,
          topic_id VARCHAR(64),
          question TEXT NOT NULL,
          answer TEXT,
          audio_url TEXT,
          photo_url TEXT,
          input_mode VARCHAR(16) DEFAULT 'text',
          status VARCHAR(20) DEFAULT 'queued',
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cohort_aggregates (
          cohort_id VARCHAR(64) PRIMARY KEY,
          cohort_name TEXT NOT NULL,
          sponsor_name TEXT NOT NULL,
          active_learners INT DEFAULT 0,
          sessions_completed INT DEFAULT 0,
          avg_mastery_gain NUMERIC(5,2) DEFAULT 0.0,
          offline_sessions_percent NUMERIC(5,2) DEFAULT 0.0,
          cost_per_learner NUMERIC(6,2) DEFAULT 0.0,
          updated_at BIGINT NOT NULL
        );
      `);
      isConnected = true;
      console.log('[Neon DB] Serverless Postgres tables verified & connected successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Neon DB] Connection failed, falling back to in-memory store:', err.message);
    isConnected = false;
    return false;
  }
}

export function isNeonConnected(): boolean {
  return isConnected;
}

export async function insertSyncEvent(ev: {
  eventId: string;
  learnerId: string;
  questionId: string;
  skillId: string;
  chosenAnswer: string;
  correct: boolean;
  hintsUsed?: number;
  timeMs?: number;
  inputMode?: string;
  receiptHash?: string;
  ts: number;
}): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO sync_events (event_id, learner_id, question_id, skill_id, chosen_answer, correct, hints_used, time_ms, input_mode, receipt_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        ev.eventId,
        ev.learnerId,
        ev.questionId,
        ev.skillId,
        ev.chosenAnswer,
        ev.correct,
        ev.hintsUsed || 0,
        ev.timeMs || 0,
        ev.inputMode || 'tap',
        ev.receiptHash || null,
        ev.ts,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Neon DB] Error inserting sync event:', err);
    return false;
  }
}

export async function insertOrUpdateDoubt(doubt: {
  id: string;
  learnerId: string;
  topicId?: string;
  question: string;
  answer?: string;
  audioUrl?: string;
  photoUrl?: string;
  inputMode?: string;
  status: string;
  ts: number;
}): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO doubts_queue (id, learner_id, topic_id, question, answer, audio_url, photo_url, input_mode, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         answer = EXCLUDED.answer,
         audio_url = EXCLUDED.audio_url,
         status = EXCLUDED.status`,
      [
        doubt.id,
        doubt.learnerId,
        doubt.topicId || null,
        doubt.question,
        doubt.answer || null,
        doubt.audioUrl || null,
        doubt.photoUrl || null,
        doubt.inputMode || 'text',
        doubt.status,
        doubt.ts,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Neon DB] Error inserting doubt:', err);
    return false;
  }
}
