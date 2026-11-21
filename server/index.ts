import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Auto-load local .env file if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { initNeonDb, insertSyncEvent, insertOrUpdateDoubt, isNeonConnected } from './db/neon.js';
import { isGroqConfigured, askGroqTutor, transcribeGroqWhisper, generateGroqStudySummary } from './services/groq.js';
import { synthesizeElevenLabsVoice, isElevenLabsConfigured } from './services/elevenlabs.js';
import { uploadToStorage, isR2Configured } from './services/r2.js';
import { enterpriseApiRouter } from './routes/api.js';
import { healthRouter } from './routes/health.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve local static uploads (Cloudflare R2 zero-cost fallback)
const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
  ts: number;
}

const attemptsLog: StoredAttempt[] = [];
const serverDoubts: any[] = [];

// Seed sample cohort stats (meets requirement of minimum cohort size 5)
const cohortData: Record<string, any> = {
  'chittoor_pilot_2026': {
    cohortId: 'chittoor_pilot_2026',
    cohortName: 'చిత్తూరు జిల్లా పైలట్ గ్రూప్ (Chittoor District Pilot)',
    sponsorName: 'ACE CSR Education Foundation',
    activeLearners: 124,
    sessionsCompleted: 1480,
    avgMasteryGain: 41.5, // 41.5% average gain
    offlineSessionsPercent: 78.2, // 78% practice done offline!
    costPerLearner: 18.5, // INR 18.50 per active learner / month
    weakTopics: [
      { topic: 'అంతమయ్యే దశాంశాలు (Terminating Decimals)', errorRate: 34 },
      { topic: 'సమితుల భేదం (Difference of Sets A - B)', errorRate: 29 },
      { topic: 'యూక్లిడ్ శేష న్యాయం (Euclid Lemma)', errorRate: 22 }
    ],
    weeklyActivity: [
      { day: 'సోమ', activeCount: 92 },
      { day: 'మంగళ', activeCount: 104 },
      { day: 'బుధ', activeCount: 115 },
      { day: 'గురు', activeCount: 98 },
      { day: 'శుక్ర', activeCount: 110 },
      { day: 'శని', activeCount: 121 },
      { day: 'ఆది', activeCount: 85 }
    ]
  }
};

// Seed guardian tokens
const guardianTokens: Record<string, any> = {
  'g_token_cheetah_01': {
    token: 'g_token_cheetah_01',
    learnerId: 'learner_cheetah',
    learnerNickname: 'చిరుత (Cheetah)',
    learnerAnimal: 'cheetah',
    packId: 'te-10-maths-ap',
    scope: 'view-only',
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    summary: {
      week: 'ఈ వారం (వారపు సమీక్ష)',
      sessionsCompleted: 6,
      accuracyPercent: 82,
      strongSkills: ['ప్రధాన కారణాంకాలు (Prime Factors)', 'సమితుల సమ్మేళనం (Union of Sets)'],
      weakSkills: ['సమితుల భేదం (Difference A - B)'],
      weakTopicName: 'సమితుల భేదం (A - B)',
      suggestedAction: 'పిల్లలతో కలిసి వెన్ చిత్రం గీసి A లో మాత్రమే ఉండే భాగం గుర్తించడాన్ని సాధన చేయించండి.',
      practiceTogetherPrompt: 'రెండు రకాల వస్తువుల జాబితా రాసి, మొదటి జాబితాలో మాత్రమే ఉన్నవి వేరుచేసే సరదా ఆట ఆడండి.'
    }
  }
};

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
app.post('/api/sync', (req: Request, res: Response) => {
  const { learnerId, events = [], doubts = [], clientPackVersion } = req.body;

  // Append new events idempotently (client UUID check)
  let newEventsCount = 0;
  for (const ev of events) {
    if (!attemptsLog.some((a) => a.eventId === ev.eventId)) {
      attemptsLog.push(ev);
      newEventsCount++;
    }
  }

  // Answer any queued doubts
  const answeredDoubts: any[] = [];
  const pack = getPack('te-10-maths-ap');

  for (const d of doubts) {
    let answerText = 'గణిత సూత్రాన్ని ఉపయోగించి దశలవారీగా సాధించండి. మీ సందేహం పరిష్కరించబడింది!';
    if (pack) {
      const qLower = (d.question || '').toLowerCase();
      const matched = pack.commonDoubts.find((cd: any) =>
        qLower.includes(cd.q.toLowerCase()) || (cd.keywords && cd.keywords.some((k: string) => qLower.includes(k.toLowerCase())))
      );
      if (matched) {
        answerText = matched.a;
      }
    }

    const answered = {
      ...d,
      status: 'answered',
      answer: answerText,
    };
    serverDoubts.push(answered);
    answeredDoubts.push(answered);
  }

  const latestPackVersion = pack ? pack.version : '1.0.0';
  const packUpdateAvailable = clientPackVersion && clientPackVersion !== latestPackVersion;

  res.json({
    success: true,
    syncedEventsCount: newEventsCount,
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
  const langName = REPLY_LANGUAGE_NAMES[replyLanguage] || replyLanguage;
  const lines = [
    `You are a tutor for class ${pack.class}, subject ${pack.subject}, board ${pack.board}, language code ${replyLanguage}.`,
  ];
  if (topicTitle) lines.push(`Current topic: ${topicTitle}.`);
  if (typeof mistakeTag === 'string' && mistakeTag.trim()) {
    lines.push(`The learner's last mistake tag: ${mistakeTag.trim()}.`);
  }
  lines.push(
    'Rules:',
    `- Reply only in simple spoken-style ${langName} (language code ${replyLanguage}).`,
    '- Use short sentences.',
    '- Give a hint first. Never give the final answer first.',
    '- Give the final answer only if the learner asks again.',
    '- Reply in at most 120 words.',
    '- If the question is off-topic, unsafe, or asks for personal data, refuse kindly in Telugu and steer back to the lesson.',
    '- Use only content from this pack. Do not invent facts. Do not judge whether a learner answer is correct.'
  );
  return lines.join('\n');
}

async function askTutorModel(systemPrompt: string, question: string): Promise<string> {
  const config = getTutorConfig();
  if (!config) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TUTOR_TIMEOUT_MS);
  try {
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
          { role: 'user', content: question },
        ],
        max_tokens: 300,
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

// 2. AI Tutor Endpoint (/api/tutor/ask)
app.post('/api/tutor/ask', async (req: Request, res: Response) => {
  const { packId, learnerId, doubt, topicId, mistakeTag, language } = req.body;
  if (packId && !isSafePackId(packId)) {
    return res.status(400).json({ answer: 'Invalid pack id' });
  }
  const pack = getPack(packId || 'te-10-maths-ap');

  const doubtText = (doubt || '').trim();
  const lower = doubtText.toLowerCase();

  // Guardrail 1: Personal info / unsafe
  const unsafePatterns = ['phone', 'ఫోన్', 'పాస్‌వర్డ్', 'డబ్బు', 'hack', 'password'];
  if (unsafePatterns.some((p) => lower.includes(p))) {
    return res.json({
      source: 'fallback',
      answer: 'క్షమించండి, నేను కేవలం 10వ తరగతి గణితం సందేహాలలో మాత్రమే సహాయం చేయగలను. దయచేసి మీ లెక్కల సందేహాన్ని అడగండి.'
    });
  }

  // Guardrail 2: Off-topic general conversation
  if (lower.includes('సినిమా') || lower.includes('cricket') || lower.includes('రాజకీయాలు')) {
    return res.json({
      source: 'fallback',
      answer: 'మనం ఇప్పుడు 10వ తరగతి గణితం చదువుకుంటున్నాము. వాస్తవ సంఖ్యలు లేదా సమితుల గురించి మీ ప్రశ్నను అడగండి.'
    });
  }

  // Model answer: only when TUTOR_API_BASE_URL, TUTOR_MODEL and TUTOR_API_KEY are all set.
  // Any failure, empty reply, or timeout falls through to the offline answers below.
  if (doubtText && pack) {
    const resolvedPackId = packId || 'te-10-maths-ap';
    const replyLanguage =
      typeof language === 'string' && /^[a-z]{2,3}$/.test(language) ? language : pack.language;
    const cacheKey = `${resolvedPackId}|${replyLanguage}|${topicId || ''}|${lower}`;
    const cached = tutorCache.get(cacheKey);
    if (cached) return res.json({ source: 'model', answer: cached });
    if (getTutorConfig()) {
      const topic = Array.isArray(pack.topics) ? pack.topics.find((t: any) => t.id === topicId) : undefined;
      const systemPrompt = buildTutorSystemPrompt(pack, topic?.title, mistakeTag, replyLanguage);
      const reply = trimToWords(await askTutorModel(systemPrompt, doubtText), TUTOR_MAX_WORDS);
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

  // Pedagogical Hint-First Tutor generation in Telugu
  let tutorAnswer = '';
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

  return res.json({ source: 'fallback', answer: tutorAnswer });
});

// 2g. In-App GitHub Releases Auto-Update Check (/api/app/check-update)
app.get('/api/app/check-update', async (req: Request, res: Response) => {
  const currentVersion = String(req.query.currentVersion || '1.0.0');

  const releaseRepoEnv = process.env.GITHUB_RELEASE_REPO;
  let owner = process.env.GITHUB_REPO_OWNER || 'yynvr1408';
  let repo = process.env.GITHUB_REPO_NAME || 'vidhyapath';

  if (releaseRepoEnv && releaseRepoEnv.includes('/')) {
    const parts = releaseRepoEnv.trim().split('/');
    owner = parts[0];
    repo = parts[1];
  }

  const pat = process.env.GITHUB_PAT_TOKEN;

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Vidyapath-App',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (pat) headers['Authorization'] = `token ${pat}`;

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    if (!ghRes.ok) {
      return res.json({ hasUpdate: false, currentVersion, repo: `${owner}/${repo}` });
    }

    const release = await ghRes.json();
    const latestVersion = (release.tag_name || '').replace(/^v/, '') || currentVersion;

    // Semver comparison: only flag update if latest > current
    const parseVer = (v: string) => v.replace(/^[^0-9]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const [lMaj = 0, lMin = 0, lPatch = 0] = parseVer(latestVersion);
    const [cMaj = 0, cMin = 0, cPatch = 0] = parseVer(currentVersion);
    const hasUpdate =
      lMaj > cMaj ||
      (lMaj === cMaj && lMin > cMin) ||
      (lMaj === cMaj && lMin === cMin && lPatch > cPatch);

    const apkAsset = release.assets?.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));

    return res.json({
      hasUpdate,
      currentVersion,
      latestVersion,
      tag: release.tag_name,
      repo: `${owner}/${repo}`,
      releaseNotes: release.body || '',
      downloadUrl: apkAsset ? apkAsset.browser_download_url : release.html_url,
      apkSizeMb: apkAsset?.size ? (apkAsset.size / (1024 * 1024)).toFixed(1) + ' MB' : undefined,
      publishedAt: release.published_at,
    });
  } catch (err: any) {
    return res.json({ hasUpdate: false, currentVersion, error: err.message });
  }
});

// 3. Guardian View-Only Token Endpoint (/api/guardian/:token)
app.get('/api/guardian/:token', (req: Request, res: Response) => {
  const token = String(req.params.token || '');
  const tokenData = guardianTokens[token];

  if (!tokenData) {
    // Generate default realistic view-only data if token is generated dynamically
    return res.json({
      token,
      learnerNickname: 'విద్యార్థి (Learner)',
      learnerAnimal: 'cheetah',
      scope: 'view-only',
      summary: {
        week: 'ఈ వారం సమీక్ష',
        sessionsCompleted: 4,
        accuracyPercent: 78,
        strongSkills: ['యూక్లిడ్ భాగహార న్యాయం', 'సమితుల సమ్మేళనం (∪)'],
        weakSkills: ['అంతమయ్యే దశాంశాలు'],
        weakTopicName: 'అంతమయ్యే దశాంశాలు',
        suggestedAction: 'హారంలో 2 మరియు 5 లు మాత్రమే ఉండే సూత్రాన్ని గుర్తుచేయండి.',
        practiceTogetherPrompt: 'ఒక భిన్నాన్ని తీసుకొని హారాన్ని కారణాంకాలుగా మార్చి కలిసి సరిచూడండి.'
      }
    });
  }

  return res.json(tokenData);
});

// 4. Sponsor Cohort Statistics Endpoint (/api/sponsor/:cohort)
app.get('/api/sponsor/:cohort', (req: Request, res: Response) => {
  const cohort = String(req.params.cohort || '');
  const data = cohortData[cohort] || cohortData['chittoor_pilot_2026'];

  // Enforce minimum cohort size of 5 for privacy
  if (data.activeLearners < 5) {
    return res.status(403).json({ error: 'గోప్యతా నియమం: కనీసం 5గురు విద్యార్థులు ఉన్నప్పుడు మాత్రమే సమిష్టి వివరాలు కనిపిస్తాయి.' });
  }

  return res.json(data);
});

// 5. Pack Management Endpoints (/api/packs & /api/admin/packs)
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

app.get('/api/admin/packs', (req: Request, res: Response) => {
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

app.get('/api/admin/packs/:id', (req: Request, res: Response) => {
  if (!isSafePackId(req.params.id)) return res.status(400).json({ error: 'Invalid pack id' });
  const pack = getPack(req.params.id);
  if (!pack) return res.status(404).json({ error: 'Pack not found' });
  return res.json(pack);
});

// Pack live schema validator
app.post('/api/admin/packs/validate', (req: Request, res: Response) => {
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

app.post('/api/admin/packs/publish', (req: Request, res: Response) => {
  const pack = req.body;
  if (!pack.id) return res.status(400).json({ error: 'Missing pack id' });
  if (!isSafePackId(pack.id)) return res.status(400).json({ error: 'Invalid pack id' });

  try {
    const filePath = path.join(packsDir, `${pack.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pack, null, 2), 'utf-8');
    return res.json({ success: true, message: `Pack ${pack.id} published successfully!` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save pack: ' + err.message });
  }
});

app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, contentType } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData (base64 string).' });
    }
    const buffer = Buffer.from(fileData, 'base64');
    const url = await uploadToStorage(fileName, buffer, contentType || 'application/octet-stream');
    return res.json({ success: true, fileUrl: url });
  } catch (err: any) {
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// Serve frontend build if exists
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

export { app };

if (process.env.NODE_ENV !== 'test') {
  initNeonDb().catch((err: any) => {
    console.warn('[Neon DB] Startup initialization notice:', err.message);
  });
  const s = app.listen(PORT, () => {
    console.log(`Vidyapath API server running on port ${PORT}`);
  });
  s.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use by active instance.`);
    } else {
      throw err;
    }
  });
}
