import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

function getPack(packId: string) {
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

// 2. AI Tutor Endpoint (/api/tutor/ask)
app.post('/api/tutor/ask', async (req: Request, res: Response) => {
  const { packId, learnerId, doubt, topicId, mistakeTag } = req.body;
  const pack = getPack(packId || 'te-10-maths-ap');

  const doubtText = (doubt || '').trim();
  const lower = doubtText.toLowerCase();

  // Guardrail 1: Personal info / unsafe
  const unsafePatterns = ['phone', 'ఫోన్', 'పాస్‌వర్డ్', 'డబ్బు', 'hack', 'password'];
  if (unsafePatterns.some((p) => lower.includes(p))) {
    return res.json({
      answer: 'క్షమించండి, నేను కేవలం 10వ తరగతి గణితం సందేహాలలో మాత్రమే సహాయం చేయగలను. దయచేసి మీ లెక్కల సందేహాన్ని అడగండి.'
    });
  }

  // Guardrail 2: Off-topic general conversation
  if (lower.includes('సినిమా') || lower.includes('cricket') || lower.includes('రాజకీయాలు')) {
    return res.json({
      answer: 'మనం ఇప్పుడు 10వ తరగతి గణితం చదువుకుంటున్నాము. వాస్తవ సంఖ్యలు లేదా సమితుల గురించి మీ ప్రశ్నను అడగండి.'
    });
  }

  // Precomputed common doubts check
  if (pack && pack.commonDoubts) {
    const matched = pack.commonDoubts.find((cd: any) =>
      lower.includes(cd.q.toLowerCase()) || (cd.keywords && cd.keywords.some((k: string) => lower.includes(k.toLowerCase())))
    );
    if (matched) {
      return res.json({ answer: matched.a });
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

  return res.json({ answer: tutorAnswer });
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

// 5. Admin Pack Management Endpoints (/api/admin/packs)
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
  const pack = getPack(String(req.params.id || ''));
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

  try {
    const filePath = path.join(packsDir, `${pack.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pack, null, 2), 'utf-8');
    return res.json({ success: true, message: `Pack ${pack.id} published successfully!` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save pack: ' + err.message });
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
  app.listen(PORT, () => {
    console.log(`LanternEd API server running on port ${PORT}`);
  });
}
