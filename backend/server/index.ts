import './env.js';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID, timingSafeEqual } from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { insertSyncEvent, insertOrUpdateDoubt, isNeonConnected } from './db/neon.js';
import { dataStore } from './db/store.js';
import { isGroqConfigured, askGroqTutor, transcribeGroqWhisper, generateGroqStudySummary } from './services/groq.js';
import { synthesizeElevenLabsVoice, isElevenLabsConfigured } from './services/elevenlabs.js';
import { uploadToR2, uploadToStorage, isR2Configured } from './services/r2Storage.js';
import { enterpriseApiRouter } from './routes/api.js';
import { healthRouter } from './routes/health.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';
import { AuthenticatedRequest, requireAuth, requireRole } from './services/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean));

// CORS for the browser PWA, API tooling, and configured custom domains
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. local tooling or same-origin edge proxies)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With', 'X-Forwarded-Host'],
    exposedHeaders: ['Idempotency-Key', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Cache'],
  })
);
app.use(express.json({ limit: '10mb' }));

// Memory storage for Multer (Zero files written to Render's ephemeral disk)
const memoryStorage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// Admin access is username/password (Admin / admin123) or code-gated.
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || 'VIDYA-2026';

function readAdminCode(req: Request): string {
  const header = req.headers['x-admin-code'];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  const fromBody = req.body && typeof req.body === 'object' ? req.body.adminCode : undefined;
  return String(fromHeader || fromBody || '').trim();
}

function isValidAdminCode(candidate: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(ADMIN_ACCESS_CODE);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validateAdminCredentials(req: Request): boolean {
  const headerUser = req.headers['x-admin-user'] || req.headers['x-admin-username'];
  const headerPass = req.headers['x-admin-pass'] || req.headers['x-admin-password'];
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const user = String(headerUser || body.username || '').trim();
  const pass = String(headerPass || body.password || '').trim();
  if (user === 'Admin' && pass === 'admin123') return true;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const creds = Buffer.from(authHeader.slice(6), 'base64').toString().split(':');
    if (creds[0] === 'Admin' && creds[1] === 'admin123') return true;
  }
  return isValidAdminCode(readAdminCode(req));
}

function requireAdminCode(req: Request, res: Response, next: NextFunction) {
  if (!validateAdminCredentials(req)) {
    return res.status(401).json({ error: 'invalid_admin_credentials' });
  }
  return next();
}

// Syllabus upload: memory only (no disk writes), 10 MB limit
const syllabusUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Optional legacy static uploads reader (no writes to disk)
const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Health & readiness probes (unlimited for load balancer / K8s ingress)
app.use(healthRouter);

// Global Sliding-Window Rate Limiter
app.use(generalApiLimiter);

// Enterprise Idempotency on mutating requests
app.use(idempotencyMiddleware);

// Enterprise API routes
app.use('/api', enterpriseApiRouter);

// In-memory data store for server-side events, cohorts, and guardian tokens
interface StoredAttempt {
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

const attemptsLog: StoredAttempt[] = [];
const serverDoubts: any[] = [];

// Helper: load packs from public directory
const packsDir = path.resolve(__dirname, '../public/packs');

const SAFE_PACK_ID = /^[A-Za-z0-9_-]{1,64}$/;
function isSafePackId(id: unknown): id is string {
  return typeof id === 'string' && SAFE_PACK_ID.test(id);
}

function getPack(packId: string) {
  if (!isSafePackId(packId)) return null;
  try {
    const filePath = path.join(packsDir, `${packId}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading pack:', err);
  }
  return null;
}

// 1. Batch Sync Endpoint (/api/sync)
app.post('/api/sync', requireAuth, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { learnerId, events = [], doubts = [], clientPackVersion, language } = body;
  const account = dataStore.users.get(req.user!.userId);
  const ownedLearnerIds = new Set([req.user!.userId, account?.studentProfile?.rollNumber].filter(Boolean));
  if (!ownedLearnerIds.has(String(learnerId || '').trim())) {
    return res.status(403).json({ success: false, error: 'Progress can only be synced for the signed-in student.' });
  }
  const safeLearnerId = typeof learnerId === 'string' ? learnerId : '';
  const requestedEvents = Array.isArray(events) ? events : [];
  const requestedDoubts = Array.isArray(doubts) ? doubts : [];
  // Process sync events in-memory and persist to PostgreSQL if connected.
  // durable: isNeonConnected() signals to client whether events are stored in durable DB.

  // Append new events idempotently (client UUID check) & persist to PostgreSQL
  let newEventsCount = 0;
  const acceptedEvents: StoredAttempt[] = [];
  const syncedEventIds: string[] = [];
  for (const ev of requestedEvents) {
    const eventLearnerId = typeof ev?.learnerId === 'string' ? ev.learnerId : '';
    if (
      !safeLearnerId ||
      eventLearnerId !== safeLearnerId ||
      typeof ev?.eventId !== 'string' ||
      !ev.eventId ||
      typeof ev.questionId !== 'string' ||
      typeof ev.skillId !== 'string' ||
      typeof ev.chosenAnswer !== 'string' ||
      typeof ev.correct !== 'boolean'
    ) {
      continue;
    }

    let existing = attemptsLog.find((attempt) => attempt.eventId === ev.eventId);
    if (existing && existing.learnerId !== safeLearnerId) continue;

    const accepted = {
      ...ev,
      learnerId: safeLearnerId,
      hintsUsed: Number.isFinite(ev.hintsUsed) ? Number(ev.hintsUsed) : 0,
      timeMs: Number.isFinite(ev.timeMs) ? Number(ev.timeMs) : 0,
      inputMode: ev.inputMode === 'voice' ? 'voice' : 'tap',
      ts: Number.isFinite(ev.ts) ? Number(ev.ts) : Date.now(),
    } as StoredAttempt;
    // Always upsert into Neon when available, including events first received
    // while the server used its in-memory fallback. The database operation is
    // idempotent, so retries can safely repair that temporary persistence gap.
    if (isNeonConnected()) {
      const persisted = await insertSyncEvent({
        eventId: accepted.eventId,
        learnerId: accepted.learnerId,
        questionId: accepted.questionId,
        skillId: accepted.skillId,
        chosenAnswer: accepted.chosenAnswer,
        correct: Boolean(accepted.correct),
        hintsUsed: accepted.hintsUsed || 0,
        timeMs: accepted.timeMs || 0,
        inputMode: accepted.inputMode || 'tap',
        receiptHash: (ev as any).receiptHash || null,
        ts: accepted.ts || Date.now(),
      });
      if (!persisted) {
        return res.status(503).json({ success: false, error: 'Progress storage is temporarily unavailable.' });
      }
    }

    existing = attemptsLog.find((attempt) => attempt.eventId === ev.eventId);
    if (existing && existing.learnerId !== safeLearnerId) continue;
    if (!existing) {
      attemptsLog.push(accepted);
      newEventsCount++;
    }

    acceptedEvents.push(accepted);
    syncedEventIds.push(ev.eventId);
  }

  // Bridge student learning progress to Enterprise Student Profile
  if (safeLearnerId) {
    let matchedUser = dataStore.users.get(safeLearnerId);
    if (!matchedUser) {
      for (const u of dataStore.users.values()) {
        if (
          u.role === 'student' &&
          (u.studentProfile?.rollNumber?.toUpperCase() === safeLearnerId.toUpperCase() ||
            u.id === safeLearnerId)
        ) {
          matchedUser = u;
          break;
        }
      }
    }

    if (matchedUser && matchedUser.studentProfile) {
      const topicIdsFromEvents = acceptedEvents
        .map((e: any) => e.topicId || (e.skillId ? e.skillId.split('_').slice(0, 2).join('_') : null))
        .filter(Boolean);
      const currentCompleted = new Set(matchedUser.studentProfile.completedTopicIds || []);
      for (const tid of topicIdsFromEvents) {
        currentCompleted.add(tid);
      }
      matchedUser.studentProfile.completedTopicIds = Array.from(currentCompleted);
      dataStore.users.set(matchedUser.id, matchedUser);
    }
  }

  // Answer any queued doubts with trilingual language pack support (Telugu, Hindi, English)
  const answeredDoubts: any[] = [];
  const clientLang = String(language || '').trim().toLowerCase();
  const packId = clientLang.startsWith('hi')
    ? 'hi-10-maths-cbse'
    : clientLang.startsWith('en')
    ? 'en-10-maths-cbse'
    : 'te-10-maths-ap';

  const pack = getPack(packId) || getPack('te-10-maths-ap');

  const defaultReplies: Record<string, string> = {
    te: 'గణిత సూత్రాన్ని ఉపయోగించి దశలవారీగా సాధించండి. మీ సందేహం పరిష్కరించబడింది!',
    hi: 'गणित के सूत्र का उपयोग करके चरणबद्ध तरीके से हल करें। आपका संदेह हल हो गया है!',
    en: 'Solve step-by-step using mathematical formulas. Your doubt has been addressed!',
  };

  const defaultReply = defaultReplies[clientLang] || defaultReplies['te'];

  for (const d of requestedDoubts) {
    const doubtLearnerId = typeof d?.learnerId === 'string' ? d.learnerId : '';
    if (!safeLearnerId || doubtLearnerId !== safeLearnerId || typeof d?.id !== 'string' || !d.id) continue;

    let answerText = defaultReply;
    if (pack && pack.commonDoubts) {
      const qLower = (d.question || '').toLowerCase();
      const matched = pack.commonDoubts.find(
        (cd: any) =>
          qLower.includes(cd.q.toLowerCase()) ||
          (cd.keywords && cd.keywords.some((k: string) => qLower.includes(k.toLowerCase())))
      );
      if (matched) {
        answerText = matched.a;
      }
    }

    const answered = {
      ...d,
      learnerId: safeLearnerId,
      status: 'answered',
      answer: answerText,
    };
    // When Neon is configured, acknowledge a queued doubt after its durable write.
    const persisted = !isNeonConnected() || await insertOrUpdateDoubt({
      id: d.id || 'doubt_' + Date.now().toString(36),
      learnerId: safeLearnerId,
      topicId: d.topicId,
      question: d.question,
      answer: answerText,
      audioUrl: d.audioUrl,
      photoUrl: d.photoUrl,
      inputMode: d.inputMode || 'text',
      status: 'answered',
      ts: d.timestamp || Date.now(),
    });
    if (!persisted) {
      return res.status(503).json({ success: false, error: 'Progress storage is temporarily unavailable.' });
    }
    const savedDoubtIndex = serverDoubts.findIndex((saved) => saved.id === answered.id);
    if (savedDoubtIndex === -1) serverDoubts.push(answered);
    else serverDoubts[savedDoubtIndex] = answered;
    answeredDoubts.push(answered);
  }

  const latestPackVersion = pack ? pack.version : '1.0.0';
  const packUpdateAvailable = clientPackVersion && clientPackVersion !== latestPackVersion;

  res.json({
    success: true,
    durable: isNeonConnected(),
    syncedEventsCount: newEventsCount,
    syncedEventIds,
    answeredDoubts,
    latestPackVersion,
    packUpdateAvailable,
  });
});

// AI tutor model (optional). Configured only via server env vars. The key is never
// sent to the client or logged. Any OpenAI-compatible /chat/completions endpoint works.
const TUTOR_TIMEOUT_MS = 15000;
const TUTOR_MAX_WORDS = 120;
const tutorCache = new Map<string, string>();

function getTutorConfig() {
  const baseUrl = (process.env.TUTOR_API_BASE_URL || '').trim();
  const model = (process.env.TUTOR_MODEL || '').trim();
  const apiKey = (process.env.TUTOR_API_KEY || '').trim();
  if (!baseUrl || !model || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), model, apiKey };
}

function trimToWords(text: string, maxWords: number): string {
  return text.trim().split(/\s+/).filter(Boolean).slice(0, maxWords).join(' ');
}

const REPLY_LANGUAGE_NAMES: Record<string, string> = { en: 'English', hi: 'Hindi', te: 'Telugu' };

function buildTutorSystemPrompt(
  pack: any,
  topicTitle: string | undefined,
  mistakeTag: unknown,
  replyLanguage: string
): string {
  const langKey = replyLanguage === 'hi' ? 'hi' : replyLanguage === 'en' ? 'en' : 'te';
  const langName = REPLY_LANGUAGE_NAMES[langKey];
  const lines = [
    `You are a tutor for class ${pack.class}, subject ${pack.subject}, board ${pack.board}, language code ${langKey}.`,
  ];
  if (topicTitle) lines.push(`Current topic: ${topicTitle}.`);
  if (typeof mistakeTag === 'string' && mistakeTag.trim()) {
    lines.push(`The learner's last mistake tag: ${mistakeTag.trim()}.`);
  }
  lines.push(
    'Rules:',
    `- Reply EXCLUSIVELY in simple spoken-style ${langName} (language code ${langKey}). Never reply in any other language.`,
    '- Use short sentences.',
    '- Give a hint first. Never give the final answer first.',
    '- Give the final answer only if the learner asks again.',
    '- Reply in at most 120 words.',
    `- If the question is off-topic, unsafe, or asks for personal data, refuse kindly in ${langName} and steer back to the lesson.`,
    '- Use only content from this pack. Do not invent facts. Do not judge whether a learner answer is correct.'
  );
  return lines.join('\n');
}

async function askTutorModel(systemPrompt: string, question: string, photoBase64?: string, maxTokens = 300): Promise<string> {
  const config = getTutorConfig();
  if (!config) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TUTOR_TIMEOUT_MS);
  try {
    let userMessageContent: any = question;
    if (photoBase64 && typeof photoBase64 === 'string') {
      const url = photoBase64.startsWith('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`;
      userMessageContent = [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url } },
      ];
    }
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent },
        ],
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`Tutor model request failed with status ${response.status}`);
      return '';
    }
    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  } catch (err: any) {
    console.error('Tutor model request failed:', err?.name === 'AbortError' ? 'timeout' : 'network or parse error');
    return '';
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Syllabus store (in-memory, Render-safe: no disk; resets on restart)
// ---------------------------------------------------------------------------
type TutorMode = 'explain' | 'simpler' | 'example' | 'chat';

interface SyllabusConcept { id: string; title: string; explanation: string; keyPoints: string[] }
interface SyllabusChapter { id: string; title: string; summary: string; concepts: SyllabusConcept[] }
interface SyllabusChunk {
  id: string;
  chapterId: string;
  conceptId: string | null;
  chapterTitle: string;
  conceptTitle: string | null;
  text: string;
}
interface StoredSyllabus {
  id: string;
  language: string;
  classLevel: string;
  subject: string;
  chapters: SyllabusChapter[];
  chunks: SyllabusChunk[];
  updatedAt: string;
}

function initDefaultSyllabus(): StoredSyllabus {
  try {
    const packCandidatePaths = [
      path.resolve(__dirname, '../public/packs/te-10-maths-ap.json'),
      path.resolve(process.cwd(), 'backend/public/packs/te-10-maths-ap.json'),
      path.resolve(process.cwd(), 'public/packs/te-10-maths-ap.json'),
    ];
    for (const p of packCandidatePaths) {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        const chapters: SyllabusChapter[] = (raw.topics || []).map((t: any, i: number) => ({
          id: t.id || `ch${i + 1}`,
          title: t.title || t.titleEn || `Chapter ${i + 1}`,
          summary: t.description || `${t.titleEn || t.title} - Class 10 Maths`,
          concepts: (t.cards || []).map((c: any, ci: number) => ({
            id: c.id || `c${ci + 1}`,
            title: c.heading || `Concept ${ci + 1}`,
            explanation: c.conceptText || '',
            keyPoints: [
              c.keyTakeaway || '',
              c.workedExample ? `Problem: ${c.workedExample.problem} -> Answer: ${c.workedExample.finalAnswer}` : ''
            ].filter(Boolean)
          }))
        }));
        const chunks: SyllabusChunk[] = [];
        for (const ch of chapters) {
          chunks.push({
            id: `${ch.id}_summary`,
            chapterId: ch.id,
            conceptId: null,
            chapterTitle: ch.title,
            conceptTitle: null,
            text: `${ch.title}: ${ch.summary}`,
          });
          for (const c of ch.concepts) {
            chunks.push({
              id: `${ch.id}_${c.id}`,
              chapterId: ch.id,
              conceptId: c.id,
              chapterTitle: ch.title,
              conceptTitle: c.title,
              text: `${ch.title} - ${c.title}. ${c.explanation} ${c.keyPoints.join(' ')}`,
            });
          }
        }
        return {
          id: raw.id || 'default_class10_maths',
          language: raw.language || 'te',
          classLevel: String(raw.class || '10'),
          subject: raw.subject || 'mathematics',
          chapters,
          chunks,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('[Syllabus] Could not load default syllabus from disk, using fallback:', err);
  }

  const fallbackChapters: SyllabusChapter[] = [
    {
      id: 'ch1_real_numbers',
      title: 'అధ్యాయం 1: వాస్తవ సంఖ్యలు (Real Numbers)',
      summary: 'యూక్లిడ్ భాగహార న్యాయం, అంకగణిత ప్రాథమిక సిద్ధాంతం, అంతమయ్యే మరియు అంతముకాని ఆవర్తన దశాంశాలు.',
      concepts: [
        { id: 'c1', title: "Euclid's Division Lemma", explanation: 'a = bq + r, where 0 <= r < b.', keyPoints: ['Used to find HCF', 'Dividend = Divisor x Quotient + Remainder'] },
        { id: 'c2', title: 'Fundamental Theorem of Arithmetic', explanation: 'Every composite number can be expressed as a unique product of prime numbers.', keyPoints: ['HCF x LCM = Product of two numbers', 'Unique prime factorization'] },
        { id: 'c3', title: 'Terminating Decimals', explanation: 'Denominator q must have prime factors in form 2^n * 5^m.', keyPoints: ['2 and 5 prime factors terminate', 'Other primes result in non-terminating repeating decimals'] }
      ]
    },
    {
      id: 'ch2_sets',
      title: 'అధ్యాయం 2: సమితులు (Sets)',
      summary: 'సమితి రూపాలు, ఉపసమితులు, సమ్మేళనం, ఛేదనం మరియు వెన్ చిత్రాలు.',
      concepts: [
        { id: 'c1', title: 'Roster and Set-Builder Forms', explanation: 'Listing elements inside curly braces { } or defining common property {x : x is ...}.', keyPoints: ['Order does not matter', 'No duplicate elements'] },
        { id: 'c2', title: 'Union and Intersection (A U B, A ∩ B)', explanation: 'Union combines elements from both sets; intersection keeps elements in both sets.', keyPoints: ['Disjoint sets: A ∩ B = ∅', 'Venn diagram representation'] }
      ]
    }
  ];

  return {
    id: 'default_class10_maths',
    language: 'te',
    classLevel: '10',
    subject: 'mathematics',
    chapters: fallbackChapters,
    chunks: fallbackChapters.map((ch) => ({
      id: `${ch.id}_chunk`,
      chapterId: ch.id,
      conceptId: null,
      chapterTitle: ch.title,
      conceptTitle: null,
      text: `${ch.title}: ${ch.summary}`,
    })),
    updatedAt: new Date().toISOString(),
  };
}

const defaultSyllabus = initDefaultSyllabus();
const syllabusStore = new Map<string, StoredSyllabus>();
syllabusStore.set('mathematics', defaultSyllabus);
syllabusStore.set('maths', defaultSyllabus);
syllabusStore.set('default', defaultSyllabus);
let activeSyllabusKey: string | null = 'mathematics';

function syllabusKeyOf(subject: string): string {
  return subject.trim().toLowerCase();
}

function findSyllabus(subject?: unknown): StoredSyllabus {
  const s = typeof subject === 'string' ? syllabusKeyOf(subject) : '';
  const key = s || activeSyllabusKey || 'mathematics';
  return syllabusStore.get(key) || defaultSyllabus;
}

// Keyword retrieval over syllabus chunks (no embeddings, no external calls)
function retrieveChunks(
  syllabus: StoredSyllabus,
  query: string,
  opts: { chapterId?: string; conceptId?: string | null },
  k = 6
): SyllabusChunk[] {
  if (opts.chapterId || opts.conceptId) {
    return syllabus.chunks
      .filter((c) => (opts.chapterId ? c.chapterId === opts.chapterId : true))
      .filter((c) => (opts.conceptId ? c.conceptId === opts.conceptId : true))
      .slice(0, k);
  }
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((t) => t.length > 2);
  const scored = syllabus.chunks
    .map((c) => {
      const text = c.text.toLowerCase();
      const score = tokens.reduce((n, t) => (text.includes(t) ? n + 1 : n), 0);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return syllabus.chunks.slice(0, k);
  return scored.slice(0, k).map((x) => x.c);
}

const SYLLABUS_LANGUAGES = ['te', 'hi', 'en'];

function parseSyllabusTextFallback(text: string, language: string, classLevel: string, subject: string): SyllabusChapter[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const chapters: SyllabusChapter[] = [];
  let currentChapter: SyllabusChapter | null = null;
  let currentConcepts: { id: string; title: string; explanation: string; keyPoints: string[] }[] = [];

  const chapterRegex = /^(?:chapter|unit|అధ్యాయం|अध्याय|part)\s*(\d+|[ivxldcm]+)?[:.\s-]*(.*)$/i;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const match = line.match(chapterRegex);
    if (match || (!currentChapter && idx === 0)) {
      if (currentChapter) {
        currentChapter.concepts = currentConcepts.length > 0 ? currentConcepts : [
          {
            id: `${currentChapter.id}_c1`,
            title: language === 'te' ? 'ప్రాథమిక భావనలు' : language === 'hi' ? 'मूल अवधारणाएँ' : 'Core Concepts',
            explanation: currentChapter.summary || (language === 'te' ? 'ఈ అధ్యాయంలో ముఖ్యమైన భావనల వివరణ.' : language === 'hi' ? 'इस अध्याय में मुख्य अवधारणाओं का विवरण।' : 'Overview of fundamental concepts in this chapter.'),
            keyPoints: [language === 'te' ? 'సూత్రాలు మరియు సిద్ధాంతాలు' : language === 'hi' ? 'सूत्र और सिद्धांत' : 'Key formulas and definitions'],
          }
        ];
        chapters.push(currentChapter);
      }
      const chIndex = chapters.length + 1;
      const rawTitle = match ? (match[2] || line) : line;
      const title = rawTitle.replace(/^[:.\s-]+/, '') || `Chapter ${chIndex}`;
      currentChapter = {
        id: `ch${chIndex}`,
        title: line.startsWith('Chapter') || line.startsWith('Unit') || line.startsWith('అధ్యాయం') || line.startsWith('अध्याय') ? line : `Chapter ${chIndex}: ${title}`,
        summary: `${title} - Class ${classLevel || '10'} ${subject}`,
        concepts: []
      };
      currentConcepts = [];
    } else if (currentChapter) {
      if (line.startsWith('-') || line.startsWith('*') || /^\d+[.)]/.test(line)) {
        const conceptTitle = line.replace(/^[-*\d.)\s]+/, '').trim();
        if (conceptTitle.length > 2) {
          const cId = `c${currentConcepts.length + 1}`;
          currentConcepts.push({
            id: cId,
            title: conceptTitle,
            explanation: language === 'te'
              ? `${conceptTitle} గురించిన సమగ్ర వివరణ మరియు సూత్రాలు.`
              : language === 'hi'
              ? `${conceptTitle} का विस्तृत विवरण एवं सूत्र।`
              : `Comprehensive explanation and worked steps for ${conceptTitle}.`,
            keyPoints: [
              language === 'te' ? 'ముఖ్యమైన నిర్వచనం మరియు సూత్రం' : language === 'hi' ? 'महत्वपूर्ण परिभाषा एवं सूत्र' : 'Key formula & definition',
              language === 'te' ? 'దశలవారీగా సాధన' : language === 'hi' ? 'चरणबद्ध समाधान' : 'Step-by-step problem solving'
            ]
          });
        }
      } else if (!currentChapter.summary || currentChapter.summary.length < 50) {
        currentChapter.summary = `${currentChapter.summary}: ${line}`.slice(0, 200);
      }
    }
  }

  if (currentChapter) {
    currentChapter.concepts = currentConcepts.length > 0 ? currentConcepts : [
      {
        id: `${currentChapter.id}_c1`,
        title: language === 'te' ? 'ప్రాథమిక భావనలు' : language === 'hi' ? 'मूल अवधारणाएँ' : 'Core Concepts',
        explanation: currentChapter.summary || (language === 'te' ? 'ఈ అధ్యాయంలో ముఖ్యమైన భావనల వివరణ.' : language === 'hi' ? 'इस अध्याय में मुख्य अवधारणाओं का विवरण।' : 'Overview of fundamental concepts in this chapter.'),
        keyPoints: [language === 'te' ? 'సూత్రాలు మరియు సిద్ధాంతాలు' : language === 'hi' ? 'सूत्र और सिद्धांत' : 'Key formulas and definitions'],
      }
    ];
    chapters.push(currentChapter);
  }

  if (chapters.length === 0) {
    chapters.push({
      id: 'ch1',
      title: subject ? `Chapter 1: ${subject}` : 'Chapter 1: Curriculum Overview',
      summary: text.slice(0, 150),
      concepts: [
        {
          id: 'c1',
          title: language === 'te' ? 'ప్రధాన భావనలు' : language === 'hi' ? 'प्रमुख अवधारणाएँ' : 'Essential Concepts',
          explanation: text.slice(0, 300) || 'Comprehensive introduction to syllabus units and practice goals.',
          keyPoints: ['Core definitions', 'Worked examples']
        }
      ]
    });
  }

  return chapters;
}

// Admin: verify access (Username: Admin / Password: admin123 or access code)
app.post('/api/admin/verify', (req: Request, res: Response) => {
  if (validateAdminCredentials(req)) {
    return res.json({ ok: true, success: true });
  }
  return res.status(401).json({ error: 'invalid_credentials' });
});

// Admin: verify access code (legacy compatibility)
app.post('/api/admin/verify-code', requireAdminCode, (_req: Request, res: Response) => {
  return res.json({ ok: true, success: true });
});

// Admin: upload syllabus (.txt / .md / .pdf) -> chapters + RAG chunks
app.post('/api/admin/syllabus', syllabusUpload.single('file'), requireAdminCode, async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const subject = String(body.subject || '').trim();
    if (!subject) return res.status(400).json({ error: 'subject_required' });

    const language = String(body.language || 'en').trim().toLowerCase();
    if (!SYLLABUS_LANGUAGES.includes(language)) return res.status(400).json({ error: 'unsupported_language' });
    const classLevel = String(body.classLevel || '10').trim();

    let text = '';
    if (req.file) {
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      if (ext === '.txt' || ext === '.md') {
        text = req.file.buffer.toString('utf8');
      } else if (ext === '.pdf') {
        const pdfParseModule: any = await (import('pdf-parse' as any) as Promise<any>).catch(() => null);
        const pdfParse = pdfParseModule?.default || pdfParseModule;
        if (typeof pdfParse === 'function') {
          const parsed = await pdfParse(req.file.buffer);
          text = parsed.text || '';
        } else {
          return res.status(400).json({ error: 'pdf_parser_unavailable' });
        }
      } else {
        return res.status(400).json({ error: 'unsupported_file_type' });
      }
    } else {
      text = typeof body.text === 'string' ? body.text : '';
    }
    text = text.trim();
    if (!text) return res.status(400).json({ error: 'empty_syllabus' });

    let chapters: SyllabusChapter[] = [];

    if (getTutorConfig()) {
      try {
        const systemPrompt = [
          'You are a curriculum analyzer. Split the syllabus or textbook text into chapters and concepts.',
          'Return STRICT JSON only: no markdown, no commentary. Use exactly this shape:',
          '{"chapters":[{"id":"ch1","title":"","summary":"","concepts":[{"id":"c1","title":"","explanation":"","keyPoints":[""]}]}]}',
          `Write summary and explanation text ENTIRELY in ${REPLY_LANGUAGE_NAMES[language]} (language code ${language}).`,
          'Keep chapter and concept titles exactly as in the source text.',
          `explanation: 2 to 4 simple sentences a Class ${classLevel || '8-10'} student can understand.`,
          'keyPoints: 2 to 5 short strings. Use only the source text. Do not invent chapters.',
        ].join('\n');
        const raw = await askTutorModel(systemPrompt, `Subject: ${subject}\nClass: ${classLevel}\n\nSYLLABUS TEXT:\n${text.slice(0, 30000)}`, undefined, 4000);
        if (raw) {
          const unfenced = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(unfenced);
          const rawChapters: any[] = Array.isArray(parsed?.chapters) ? parsed.chapters : [];
          if (rawChapters.length > 0) {
            chapters = rawChapters.map((ch: any, i: number) => ({
              id: String(ch?.id || `ch${i + 1}`),
              title: String(ch?.title || `Chapter ${i + 1}`),
              summary: String(ch?.summary || ''),
              concepts: (Array.isArray(ch?.concepts) ? ch.concepts : []).map((c: any, j: number) => ({
                id: String(c?.id || `c${j + 1}`),
                title: String(c?.title || `Concept ${j + 1}`),
                explanation: String(c?.explanation || ''),
                keyPoints: Array.isArray(c?.keyPoints) ? c.keyPoints.map((k: any) => String(k)).filter(Boolean) : [],
              })),
            }));
          }
        }
      } catch (llmErr) {
        console.warn('[Admin Syllabus] LLM parsing failed, using rule-based parser:', llmErr);
      }
    }

    if (chapters.length === 0) {
      chapters = parseSyllabusTextFallback(text, language, classLevel, subject);
    }

    const chunks: SyllabusChunk[] = [];
    for (const ch of chapters) {
      chunks.push({ id: ch.id, chapterId: ch.id, conceptId: null, chapterTitle: ch.title, conceptTitle: null, text: ch.summary });
      for (const c of ch.concepts) {
        chunks.push({
          id: `${ch.id}-${c.id}`,
          chapterId: ch.id,
          conceptId: c.id,
          chapterTitle: ch.title,
          conceptTitle: c.title,
          text: `${c.explanation} ${c.keyPoints.join('; ')}`.trim(),
        });
      }
    }

    const key = syllabusKeyOf(subject);
    const stored: StoredSyllabus = {
      id: randomUUID(),
      language,
      classLevel,
      subject,
      chapters,
      chunks,
      updatedAt: new Date().toISOString(),
    };
    syllabusStore.set(key, stored);
    activeSyllabusKey = key;

    return res.json({
      success: true,
      id: stored.id,
      language,
      classLevel,
      subject,
      chapters,
      chunkCount: chunks.length,
    });
  } catch (err: any) {
    console.error('[Admin Syllabus] Ingestion error:', err);
    return res.status(500).json({ error: 'syllabus_ingest_failed', message: err?.message || 'Ingestion failed' });
  }
});

// Public: read the active (or subject-specific) syllabus without chunks
app.get('/api/syllabus', (req: Request, res: Response) => {
  const syllabus = findSyllabus(req.query.subject);
  return res.json({
    id: syllabus.id,
    language: syllabus.language,
    classLevel: syllabus.classLevel,
    subject: syllabus.subject,
    chapters: syllabus.chapters,
  });
});

// Chapter intent helpers (no LLM call)
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

function findChapterRequest(text: string, chapters: SyllabusChapter[]): { chapter: SyllabusChapter; number: number } | null {
  const digitMatch = text.match(
    /chapter\s*(\d+)|(\d+)\s*(?:st|nd|rd|th)?\s*chapter|అధ్యాయం\s*(\d+)|(\d+)\s*అధ్యాయం|अध्याय\s*(\d+)|(\d+)\s*अध्याय/i
  );
  let n: number | null = null;
  if (digitMatch) {
    const digits = digitMatch.slice(1).find(Boolean);
    n = digits ? Number(digits) : null;
  }
  if (n === null && /chapter/i.test(text)) {
    const word = text.toLowerCase().split(/[^a-z]+/).find((w) => w in NUMBER_WORDS);
    if (word) n = NUMBER_WORDS[word];
  }
  if (n !== null && n >= 1 && n <= chapters.length) {
    return { chapter: chapters[n - 1], number: n };
  }
  // Title keyword fallback, only when the message names a chapter
  if (/chapter|అధ్యాయం|अध्याय/i.test(text)) {
    const lowerText = text.toLowerCase();
    for (let i = 0; i < chapters.length; i++) {
      const words = chapters[i].title
        .toLowerCase()
        .split(/[^\p{L}\p{M}\p{N}]+/u)
        .filter((w) => w.length > 3);
      if (words.some((w) => lowerText.includes(w))) return { chapter: chapters[i], number: i + 1 };
    }
  }
  return null;
}

function buildChapterResponse(chapter: SyllabusChapter, n: number, lang: string) {
  const reply = lang === 'hi'
    ? `अध्याय ${n}: ${chapter.title} में ये अवधारणाएँ हैं। नीचे किसी अवधारणा पर टैप करें:`
    : lang === 'te'
    ? `అధ్యాయం ${n}: ${chapter.title} లో ఈ భావనలు ఉన్నాయి. ప్రారంభించడానికి కింద ఏదైనా భావనపై నొక్కండి:`
    : `Here are the concepts in Chapter ${n}: ${chapter.title}. Tap any concept below to start learning:`;
  return {
    intent: 'chapter',
    chapterId: chapter.id,
    reply,
    concepts: chapter.concepts.map((c) => ({ id: c.id, title: c.title })),
  };
}

const SYLLABUS_HEADINGS: Record<string, [string, string, string, string]> = {
  en: ['What it is (simple meaning)', 'Daily-life example', 'Step-by-step', 'Quick check'],
  hi: ['यह क्या है (सरल अर्थ)', 'दैनिक जीवन का उदाहरण', 'चरण-दर-चरण', 'त्वरित जाँच'],
  te: ['ఇది ఏమిటి (సరళ అర్థం)', 'రోజువారీ జీవిత ఉదాహరణ', 'దశలవారీగా', 'త్వరిత తనిఖీ'],
};

function buildSyllabusTutorPrompt(opts: {
  language: string;
  subject: string;
  classLevel: string;
  chapterTitle?: string;
  conceptTitle?: string;
  mode: TutorMode;
  excerpts: string[];
}): string {
  const lang = opts.language === 'hi' || opts.language === 'en' ? opts.language : 'te';
  const langName = REPLY_LANGUAGE_NAMES[lang];
  const [h1, h2, h3, h4] = SYLLABUS_HEADINGS[lang];
  const headingBullets = [
    `- **${h1}**: 2 to 3 easy sentences in everyday language, no heavy jargon.`,
    `- **${h2}**: one relatable example for a Class 8-10 student.`,
    `- **${h3}**: numbered steps 1. 2. 3. for any formula, rule or worked example.`,
    `- **${h4}**: one friendly line asking if the student understood, or offering a quick question or the next concept.`,
  ];
  const lines = [
    `You are a friendly, patient teacher for ${opts.classLevel ? `class ${opts.classLevel}` : 'school students'}${opts.subject ? `, subject ${opts.subject}` : ''}.`,
    `Answer ENTIRELY in ${langName} (language code ${lang}). Never reply in any other language.`,
  ];
  if (opts.chapterTitle) lines.push(`Current chapter: ${opts.chapterTitle}.`);
  if (opts.conceptTitle) lines.push(`Current concept: ${opts.conceptTitle}.`);
  if (opts.excerpts.length) {
    lines.push('Use this syllabus excerpt as the source of truth:', opts.excerpts.join('\n---\n'));
  } else {
    lines.push('No syllabus excerpt was found. Teach the topic carefully and do not invent specific facts.');
  }
  if (opts.mode === 'simpler') {
    lines.push(
      'The student did not understand the previous explanation. Re-explain even more simply, with shorter sentences and everyday words. Use these four bold headings, in this order:',
      ...headingBullets
    );
  } else if (opts.mode === 'example') {
    lines.push(
      'Give a different, relatable daily-life example first, then the step-by-step working. Use these four bold headings, in this order:',
      ...headingBullets
    );
  } else if (opts.mode === 'chat') {
    lines.push(`Answer conversationally in ${langName}, like a friendly tutor chatting with the student. Keep it to a few short sentences grounded in the excerpt, and end with a short friendly question.`);
  } else {
    lines.push(
      'Structure the answer with these four bold headings, in this order, written exactly as shown:',
      ...headingBullets
    );
  }
  lines.push('Do not invent facts beyond the excerpt. Keep the language simple.');
  return lines.join('\n');
}

// 2. AI Tutor Endpoint (/api/tutor/ask) - Completely unauthenticated for frictionless student access
app.post('/api/tutor/ask', async (req: Request, res: Response) => {
  const { packId, learnerId, doubt, topicId, mistakeTag, language, photoBase64, message, chapterId, conceptId, conceptTitle, subject, mode, intent } = req.body || {};
  if (packId && !isSafePackId(packId)) {
    return res.status(400).json({ answer: 'Invalid pack id' });
  }

  // Strict language enforcement: strictly and only 'te', 'hi', and 'en'
  const ALLOWED_LANGUAGES = ['te', 'hi', 'en'] as const;
  if (language && !ALLOWED_LANGUAGES.includes(language as any)) {
    return res.status(400).json({
      error: `Unsupported language code: '${language}'. Vidyapath strictly supports only 'te', 'hi', and 'en'.`
    });
  }

  const pack = getPack(packId || 'te-10-maths-ap');
  const targetLanguage = (language && ALLOWED_LANGUAGES.includes(language as any))
    ? language
    : (pack && ALLOWED_LANGUAGES.includes(pack.language as any) ? pack.language : 'te');

  const doubtText = (doubt || message || '').trim();
  const lower = doubtText.toLowerCase();

  // Guardrail 1: Personal info / unsafe
  const unsafePatterns = [
    'phone', 'password', 'money', 'hack', 'contact', 'email',
    'ఫోన్', 'పాస్‌వర్డ్', 'డబ్బు', 'చిరునామా',
    'फोन', 'पासवर्ड', 'पैसे', 'नंबर', 'पता'
  ];
  if (unsafePatterns.some((p) => lower.includes(p))) {
    const refusal = targetLanguage === 'hi'
      ? 'क्षमा करें, मैं केवल कक्षा 10 गणित के प्रश्नों में मदद कर सकता हूँ। कृपया अपना गणितीय प्रश्न पूछें।'
      : targetLanguage === 'en'
      ? 'I apologize, but I can only assist with Class 10 Mathematics questions. Please ask a mathematics question.'
      : 'క్షమించండి, నేను కేవలం 10వ తరగతి గణితం సందేహాలలో మాత్రమే సహాయం చేయగలను. దయచేసి మీ లెక్కల సందేహాన్ని అడగండి.';
    return res.json({
      source: 'fallback',
      answer: refusal
    });
  }

  // Guardrail 2: Off-topic general conversation
  const offTopicPatterns = ['సినిమా', 'cricket', 'రాజకీయాలు', 'cinema', 'movie', 'फिल्म', 'राजनीति'];
  if (offTopicPatterns.some((p) => lower.includes(p))) {
    const offTopic = targetLanguage === 'hi'
      ? 'हम अभी कक्षा 10 गणित का अध्ययन कर रहे हैं। वास्तविक संख्याएँ या बहुपद के बारे में अपना प्रश्न पूछें।'
      : targetLanguage === 'en'
      ? 'We are currently studying Class 10 Mathematics. Please ask a question about Real Numbers or Polynomials.'
      : 'మనం ఇప్పుడు 10వ తరగతి గణితం చదువుకుంటున్నాము. వాస్తవ సంఖ్యలు లేదా సమితుల గురించి మీ ప్రశ్నను అడగండి.';
    return res.json({
      source: 'fallback',
      answer: offTopic
    });
  }

  // Syllabus-aware tutor. Requests without syllabus fields keep the legacy path below.
  const replyLang = ALLOWED_LANGUAGES.includes(language as any) ? String(language) : 'en';
  const syllabus = findSyllabus(subject);
  const syllabusRequested = Boolean(subject || chapterId || conceptId || conceptTitle || mode || intent);
  const tutorMode = (['simpler', 'example', 'chat'].includes(mode) ? mode : 'explain') as TutorMode;

  // Chapter Intent Handling: when student requests a chapter or asks to list concepts
  if (intent === 'list_concepts' || (!conceptId && (intent === 'chapter' || /chapter|అధ్యాయం|अध्याय/i.test(doubtText)))) {
    if (syllabus && syllabus.chapters.length > 0) {
      const idx = chapterId ? syllabus.chapters.findIndex((ch) => ch.id === chapterId) : -1;
      if (idx !== -1) {
        return res.json(buildChapterResponse(syllabus.chapters[idx], idx + 1, replyLang));
      }
      const match = findChapterRequest(doubtText, syllabus.chapters);
      if (match) {
        return res.json(buildChapterResponse(match.chapter, match.number, replyLang));
      }
    } else if (pack && Array.isArray(pack.topics) && pack.topics.length > 0) {
      const packChapters: SyllabusChapter[] = pack.topics.map((t: any, i: number) => ({
        id: t.id,
        title: t.title,
        summary: t.description || t.title,
        concepts: Array.isArray(t.cards) && t.cards.length > 0
          ? t.cards.map((c: any) => ({
              id: c.id,
              title: c.heading || `Concept ${c.stepNumber}`,
              explanation: c.conceptText || '',
              keyPoints: [c.keyTakeaway || '']
            }))
          : (t.skills || []).map((s: string, j: number) => ({
              id: `${t.id}_s${j + 1}`,
              title: s.replace(/_/g, ' '),
              explanation: `${s.replace(/_/g, ' ')} key concept`,
              keyPoints: []
            }))
      }));
      const idx = chapterId ? packChapters.findIndex((ch) => ch.id === chapterId) : -1;
      if (idx !== -1) {
        return res.json(buildChapterResponse(packChapters[idx], idx + 1, replyLang));
      }
      const match = findChapterRequest(doubtText, packChapters);
      if (match) {
        return res.json(buildChapterResponse(match.chapter, match.number, replyLang));
      }
    }
  }

  if ((syllabus || syllabusRequested) && (doubtText || conceptTitle || conceptId || chapterId) && getTutorConfig()) {
    const chapter = syllabus?.chapters.find((ch) => ch.id === chapterId);
    const concept = chapter?.concepts.find((c) => c.id === conceptId);
    const chunks = syllabus
      ? retrieveChunks(
          syllabus,
          `${doubtText} ${conceptTitle || concept?.title || ''}`,
          { chapterId: chapterId || undefined, conceptId: conceptId || undefined }
        )
      : [];
    const systemPrompt = buildSyllabusTutorPrompt({
      language: replyLang,
      subject: syllabus?.subject || String(subject || ''),
      classLevel: syllabus?.classLevel || '',
      chapterTitle: chapter?.title,
      conceptTitle: conceptTitle || concept?.title,
      mode: tutorMode,
      excerpts: chunks.map((c) => c.text),
    });
    const question = doubtText || `Teach me: ${conceptTitle || concept?.title || chapter?.title || 'this topic'}`;
    const syllabusCacheKey = `syllabus|${syllabus?.id || 'none'}|${replyLang}|${tutorMode}|${chapterId || ''}|${conceptId || ''}|${question.toLowerCase()}`;
    let reply = tutorCache.get(syllabusCacheKey) || '';
    if (!reply) {
      const raw = await askTutorModel(systemPrompt, question, photoBase64, 2500);
      reply = raw.trim();
      if (reply) tutorCache.set(syllabusCacheKey, reply);
    }
    if (reply) {
      return res.json({
        source: 'model',
        answer: reply,
        reply,
        chapterId: chapterId ?? null,
        conceptId: conceptId ?? null,
      });
    }
  }

  // Model answer: only when TUTOR_API_BASE_URL, TUTOR_MODEL and TUTOR_API_KEY are all set.
  // Any failure, empty reply, or timeout falls through to the offline answers below.
  if (doubtText && pack) {
    const resolvedPackId = packId || 'te-10-maths-ap';
    const replyLanguage = targetLanguage;
    const cacheKey = `${resolvedPackId}|${replyLanguage}|${topicId || ''}|${lower}`;
    const cached = tutorCache.get(cacheKey);
    if (cached) return res.json({ source: 'model', answer: cached });
    if (getTutorConfig()) {
      const topic = Array.isArray(pack.topics) ? pack.topics.find((t: any) => t.id === topicId) : undefined;
      const systemPrompt = buildTutorSystemPrompt(pack, topic?.title, mistakeTag, replyLanguage);
      const reply = trimToWords(await askTutorModel(systemPrompt, doubtText, photoBase64), TUTOR_MAX_WORDS);
      if (reply) {
        tutorCache.set(cacheKey, reply);
        return res.json({ source: 'model', answer: reply });
      }
    }
  }

  // Precomputed common doubts check
  if (pack && pack.commonDoubts) {
    const matched = pack.commonDoubts.find((cd: any) =>
      lower.includes(cd.q.toLowerCase()) || (cd.keywords && cd.keywords.some((k: string) => lower.includes(k.toLowerCase())))
    );
    if (matched) {
      return res.json({ source: 'fallback', answer: matched.a });
    }
  }

  // Pedagogical Hint-First Tutor generation in target language
  let tutorAnswer = '';
  if (targetLanguage === 'en') {
    if (lower.includes('hcf') || lower.includes('gcd') || lower.includes('euclid')) {
      tutorAnswer = "Euclid's division lemma: a = bq + r (0 ≤ r < b). First step: divide the larger number by the smaller, and repeat until the remainder is 0. The last divisor is the HCF.";
    } else if (lower.includes('union') || lower.includes('∪')) {
      tutorAnswer = 'Union (A ∪ B) combines all elements from both sets. Important: write each element without duplicates.';
    } else if (lower.includes('intersection') || lower.includes('∩')) {
      tutorAnswer = 'Intersection (A ∩ B) contains only the common elements present in both sets.';
    } else if (lower.includes('difference') || lower.includes('a - b')) {
      tutorAnswer = 'A - B contains elements in A that are not in B. Remove the common elements from A.';
    } else if (lower.includes('terminating') || lower.includes('decimal')) {
      tutorAnswer = 'Factorise the denominator q as 2ⁿ · 5ᵐ. If only prime factors 2 or 5 are present, it is a terminating decimal.';
    } else {
      tutorAnswer = 'Hint: Identify the fundamental formula for this problem. Try the first step, and I will guide you to the answer!';
    }
  } else if (targetLanguage === 'hi') {
    if (lower.includes('hcf') || lower.includes('मसा') || lower.includes('यूक्लिड') || lower.includes('euclid')) {
      tutorAnswer = 'यूक्लिड विभाजन प्रमेयिका: a = bq + r (0 ≤ r < b)। पहला कदम: बड़ी संख्या को छोटी संख्या से भाग दें और शेषफल 0 आने तक दोहराएं। अंतिम भाजक ही HCF होगा।';
    } else if (lower.includes('union') || lower.includes('संघ') || lower.includes('∪')) {
      tutorAnswer = 'संघ (A ∪ B) का अर्थ दोनों समुच्चयों के सभी अवयवों को मिलाना है। महत्वपूर्ण: कोई भी अवयव दोहराया नहीं जाना चाहिए।';
    } else if (lower.includes('intersection') || lower.includes('सर्वनिष्ठ') || lower.includes('∩')) {
      tutorAnswer = 'सर्वनिष्ठ (A ∩ B) में केवल वे अवयव होते हैं जो दोनों समुच्चयों में उभयनिष्ठ (कॉमन) हों।';
    } else if (lower.includes('शांत') || lower.includes('दशमलव')) {
      tutorAnswer = 'हर q को 2ⁿ · 5ᵐ के रूप में गुणनखंडित करें। यदि हर में केवल 2 या 5 हों, तो दशमलव प्रसार शांत होगा।';
    } else {
      tutorAnswer = 'संकेत: प्रश्न के मूल सूत्र पर ध्यान दें। पहला चरण हल करने का प्रयास करें, आगे का मार्गदर्शन मिलेगा!';
    }
  } else {
    // Telugu
    if (lower.includes('hcf') || lower.includes('గసాభా') || lower.includes('యూక్లిడ్') || lower.includes('euclid')) {
      tutorAnswer = 'యూక్లిడ్ భాగహార సూత్రం: a = bq + r (0 ≤ r < b). మొదటి అడుగు: పెద్ద సంఖ్యను విభాజ్యంగా (a), చిన్న సంఖ్యను విభాజకంగా (b) తీసుకోండి. శేషం 0 వచ్చేవరకు కొనసాగించండి.';
    } else if (lower.includes('సమ్మేళనం') || lower.includes('union') || lower.includes('∪')) {
      tutorAnswer = 'సమ్మేళనం (A ∪ B) అనగా రెండు సమితులలోని అన్ని మూలకాలను కలపడం. ముఖ్య గమనిక: ఏ మూలకమూ రెండుసార్లు రాయకూడదు.';
    } else if (lower.includes('ఛేదనం') || lower.includes('intersection') || lower.includes('∩')) {
      tutorAnswer = 'ఛేదనం (A ∩ B) అనగా కేవలం రెండు సమితులలోనూ ఉమ్మడిగా (రెంటిలోనూ) ఉన్న మూలకాలను మాత్రమే సమితిగా రాయడం.';
    } else if (lower.includes('భేదం') || lower.includes('difference') || lower.includes('a - b')) {
      tutorAnswer = 'A - B అంటే మొదటి సమితి A లో ఉంటూ, రెండవ సమితి B లో లేని మూలకాలు. ఉమ్మడి మూలకాలను A నుండి తొలగించండి.';
    } else if (lower.includes('దశాంశం') || lower.includes('terminating')) {
      tutorAnswer = 'హారం q ని 2ⁿ · 5ᵐ రూపంలో రాయండి. 2 లేదా 5 తప్ప మరే ఇతర ప్రధాన సంఖ్య హారంలో లేకపోతే అది అంతమయ్యే దశాంశం.';
    } else {
      tutorAnswer = 'సూచన: సమస్యలోని ప్రాథమిక సూత్రాన్ని గమనించండి. మొదట ఇచ్చిన సంఖ్యలను సూత్రంలో ప్రతిక్షేపించండి. మొదటి దశను ప్రయత్నించండి, సమాధానం సమీపిస్తుంది!';
    }
  }

  const isSimpler = tutorMode === 'simpler';
  const isExample = tutorMode === 'example';
  const [h1, h2, h3, h4] = SYLLABUS_HEADINGS[targetLanguage] || SYLLABUS_HEADINGS['en'];

  const structuredAnswer = [
    `### **${h1}**`,
    tutorAnswer,
    '',
    `### **${h2}**`,
    targetLanguage === 'hi'
      ? (isExample ? 'मान लीजिए आपके पास 20 वस्तुएँ हैं और 6 लोगों में बाँटनी हैं। प्रत्येक को 3 मिलेंगी और 2 शेष बचेंगी (20 = 6×3 + 2)।' : 'दैनिक जीवन में मापन और समान विभाजन के लिए हम इस सिद्धांत का स्वाभाविक उपयोग करते हैं।')
      : targetLanguage === 'en'
      ? (isExample ? 'If you distribute 20 items among 6 students, each gets 3 with 2 remaining: 20 = 6(3) + 2.' : 'In everyday activities like counting change or distributing items evenly, we apply this logic directly.')
      : (isExample ? 'మీ దగ్గర 20 లడ్డూలు ఉండి, 6 మంది స్నేహితులకు సమానంగా పంచితే, ప్రతి ఒక్కరికీ 3 వస్తాయి, 2 మిగులుతాయి: 20 = (6 × 3) + 2.' : 'మనం రోజువారీ జీవితంలో కొలతలు మరియు పంపకాల్లో ఈ గణిత సూత్రాలనే సహజంగా ఉపయోగిస్తాము.'),
    '',
    `### **${h3}**`,
    targetLanguage === 'hi'
      ? '1. **मूल नियम पहचानें:** प्रश्न के मुख्य मानों को सूत्र में रखें.\n2. **गणना करें:** चरण-दर-चरण हल करें.\n3. **जाँचें:** अपने अंतिम उत्तर की पुष्टि करें.'
      : targetLanguage === 'en'
      ? '1. **Identify terms:** Identify the given values in the problem.\n2. **Apply principle:** Substitute the values into the formula.\n3. **Verify:** Check your calculation and remainder constraints.'
      : '1. **లెక్కలోని ముఖ్యాంశాలు గుర్తించండి:** ఇచ్చిన సంఖ్యలను సూత్రంలో రాయండి.\n2. **దశలవారీగా సాధించండి:** క్రమంగా లెక్కిస్తూ శేషాన్ని కనుగొనండి.\n3. **సరిచూసుకోండి:** తుది సమాధానాన్ని ధృవీకరించండి.',
    '',
    `### **${h4}**`,
    targetLanguage === 'hi'
      ? 'क्या यह व्याख्या आपको समझ आई या आप इसका एक और उदाहरण देखना चाहेंगे?'
      : targetLanguage === 'en'
      ? 'Did this explanation make sense, or would you like to see another example?'
      : 'ఈ వివరణ మీకు స్పష్టంగా అర్థమైందా? మరో ఉదాహరణ కావాలా లేదా తర్వాతి భావన చూద్దామా?'
  ].join('\n');

  return res.json({ source: 'fallback', answer: structuredAnswer, reply: structuredAnswer, chapterId: chapterId ?? null, conceptId: conceptId ?? null });
});

// 5. Pack Management Endpoints (/api/packs & /api/admin/packs)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text_required' });
    if (isElevenLabsConfigured()) {
      const audioBuffer = await synthesizeElevenLabsVoice(text);
      if (audioBuffer) {
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(audioBuffer);
      }
    }
    return res.json({ fallback: true, text, language: language || 'te-IN' });
  } catch (err: any) {
    return res.json({ fallback: true, text: req.body?.text, language: req.body?.language || 'te-IN' });
  }
});
app.get('/api/packs', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(packsDir).filter((f) => f.endsWith('.json'));
    const packs = files.map((f) => {
      const content = JSON.parse(fs.readFileSync(path.join(packsDir, f), 'utf-8'));
      return {
        id: content.id,
        version: content.version,
        language: content.language,
        languageName: content.languageName,
        class: content.class,
        subject: content.subject,
        board: content.board,
        isStub: !!content.isStub,
        topicsCount: content.topics ? content.topics.length : 0,
        questionsCount: content.questions ? content.questions.length : 0,
      };
    });
    return res.json(packs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read packs' });
  }
});

app.get('/api/admin/packs', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(packsDir).filter((f) => f.endsWith('.json'));
    const packs = files.map((f) => {
      const content = JSON.parse(fs.readFileSync(path.join(packsDir, f), 'utf-8'));
      return {
        id: content.id,
        version: content.version,
        language: content.language,
        languageName: content.languageName,
        class: content.class,
        subject: content.subject,
        board: content.board,
        isStub: !!content.isStub,
        topicsCount: content.topics ? content.topics.length : 0,
        questionsCount: content.questions ? content.questions.length : 0,
      };
    });
    return res.json(packs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read packs' });
  }
});

app.get('/api/admin/packs/:id', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  if (!isSafePackId(req.params.id)) return res.status(400).json({ error: 'Invalid pack id' });
  const pack = getPack(req.params.id);
  if (!pack) return res.status(404).json({ error: 'Pack not found' });
  return res.json(pack);
});

// Pack live schema validator
app.post('/api/admin/packs/validate', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  const pack = req.body;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pack.id) errors.push('Missing required field: id');
  if (!pack.version) errors.push('Missing required field: version');
  if (!pack.language) errors.push('Missing required field: language');
  if (!pack.topics || !Array.isArray(pack.topics) || pack.topics.length === 0) {
    errors.push('Pack must contain at least 1 topic in topics[]');
  }
  if (!pack.questions || !Array.isArray(pack.questions)) {
    errors.push('Pack must contain questions array');
  }

  // Validate duplicate IDs
  const qIds = new Set<string>();
  const allSkills = new Set<string>();
  if (pack.topics) {
    for (const t of pack.topics) {
      if (t.skills) {
        for (const s of t.skills) allSkills.add(s);
      }
    }
  }

  if (pack.questions) {
    for (const q of pack.questions) {
      if (qIds.has(q.id)) {
        errors.push(`Duplicate question id found: "${q.id}"`);
      }
      qIds.add(q.id);

      if (!q.skillId || !allSkills.has(q.skillId)) {
        errors.push(`Question "${q.id}" references unknown skillId: "${q.skillId}"`);
      }

      if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
        errors.push(`Question "${q.id}" has invalid answer key: "${q.answer}" (must be A, B, C, or D)`);
      }

      if (!q.hintLadder || q.hintLadder.length < 3) {
        warnings.push(`Question "${q.id}" has fewer than 3 hints in hintLadder`);
      }
    }
  }

  return res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      topicsCount: pack.topics?.length || 0,
      skillsCount: allSkills.size,
      questionsCount: pack.questions?.length || 0,
    }
  });
});

app.post('/api/admin/packs/publish', requireAuth, requireRole(['super_admin']), (_req: Request, res: Response) => {
  return res.status(409).json({ error: 'Content packs are deployed with the frontend. Download the validated JSON and include it in frontend/public/packs before deployment.' });
});

app.post('/api/upload', requireAuth, requireRole(['student', 'guardian', 'teacher', 'institution_admin', 'academic_admin', 'super_admin']), uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    // 1. In-memory multipart file upload via multer
    if (req.file) {
      const fileKey = `${Date.now()}_${req.file.originalname}`;
      const fileUrl = await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);
      return res.json({ success: true, fileUrl, key: fileKey });
    }

    // 2. In-memory Base64 JSON payload upload
    const { fileName, fileData, contentType } = req.body;
    if (fileName && fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      const fileUrl = await uploadToR2(buffer, fileName, contentType || 'application/octet-stream');
      return res.json({ success: true, fileUrl, key: fileName });
    }

    return res.status(400).json({ error: 'Missing file in multipart form or fileData in JSON body.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Upload to R2 failed: ' + err.message });
  }
});

// POST /api/tutor/voice: In-memory voice upload to R2 + Groq Whisper transcription (0 disk writes)
app.post('/api/tutor/voice', uploadMiddleware.single('audio'), async (req: Request, res: Response) => {
  try {
    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/webm';
    let filename = `voice_${Date.now()}.webm`;

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
      filename = req.file.originalname || filename;
    } else if (req.body.audioData) {
      audioBuffer = Buffer.from(req.body.audioData, 'base64');
      mimeType = req.body.mimeType || mimeType;
    }

    if (!audioBuffer) {
      return res.status(400).json({ error: 'Missing audio file or audioData' });
    }

    const audioUrl = await uploadToR2(audioBuffer, filename, mimeType);
    const transcript = await transcribeGroqWhisper(audioBuffer, mimeType, req.body.language);

    return res.json({
      success: true,
      audioUrl,
      transcript: transcript || '',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Voice processing failed: ' + err.message });
  }
});

// POST /api/tutor/photo-doubt: In-memory photo doubt upload to R2 (0 disk writes)
app.post('/api/tutor/photo-doubt', uploadMiddleware.single('photo'), async (req: Request, res: Response) => {
  try {
    let photoBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let filename = `photo_${Date.now()}.jpg`;

    if (req.file) {
      photoBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
      filename = req.file.originalname || filename;
    } else if (req.body.photoData) {
      photoBuffer = Buffer.from(req.body.photoData, 'base64');
      mimeType = req.body.mimeType || mimeType;
    }

    if (!photoBuffer) {
      return res.status(400).json({ error: 'Missing photo file or photoData' });
    }

    const photoUrl = await uploadToR2(photoBuffer, filename, mimeType);
    return res.json({ success: true, photoUrl });
  } catch (err: any) {
    return res.status(500).json({ error: 'Photo doubt upload failed: ' + err.message });
  }
});

export { app };
