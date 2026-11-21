const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// Ordered fallback models supported on Groq Cloud
const CANDIDATE_LLM_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
];

/**
 * Queries Groq LLM for ultra-fast pedagogical tutor responses with automatic multi-model fallback.
 * Uses 600 max_tokens to accommodate reasoning models (e.g. gpt-oss-120b / gpt-oss-20b) as well as direct completion models.
 */
export async function askGroqTutor(
  doubtText: string,
  systemPrompt: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  for (const model of CANDIDATE_LLM_MODELS) {
    try {
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: doubtText },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return content.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(`[Groq API] Model ${model} returned ${res.status}:`, errText);
      }
    } catch (err: any) {
      console.warn(`[Groq API] Failed with model ${model}:`, err.message);
    }
  }

  return null;
}

/**
 * Transcribes student voice speech using Groq Whisper (whisper-large-v3-turbo / whisper-large-v3).
 * Supports multilingual input (Telugu, Hindi, English).
 */
export async function transcribeGroqWhisper(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  languageHint?: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const whisperModels = [
    process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
    'whisper-large-v3',
  ];

  for (const whisperModel of whisperModels) {
    try {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const ext = mimeType.includes('m4a') ? 'm4a' : mimeType.includes('mp3') ? 'mp3' : 'webm';
      const filename = `voice_input.${ext}`;

      // Construct multipart form data body manually to avoid external dependencies
      const head = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const modelPart = Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${whisperModel}`
      );
      const langPart = Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${languageHint || 'te'}`
      );
      const promptPart = Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\nMathematics, Euclid division lemma, sets, numbers, school curriculum`
      );
      const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

      const payload = Buffer.concat([head, audioBuffer, modelPart, langPart, promptPart, tail]);

      const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: payload,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim()) {
          return data.text.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(`[Groq Whisper] Model ${whisperModel} returned ${res.status}:`, errText);
      }
    } catch (err: any) {
      console.warn(`[Groq Whisper] Attempt with ${whisperModel} failed:`, err.message);
    }
  }

  return null;
}

/**
 * Generates an automated AI progress summary using Groq LLM.
 */
export async function generateGroqStudySummary(
  studentName: string,
  subject: string,
  stats: { totalSessions: number; accuracy: number; weakTopics: string[]; strongTopics: string[] }
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const system = `You are a supportive, insightful educational AI mentor writing a brief progress summary for student "${studentName}" in ${subject}.
Keep it strictly under 3 bullet points:
1. Praise strong topics
2. Constructive action plan for weak topics
3. Encouraging motivational quote.
Respond concisely in plain text.`;

  const prompt = `Student stats:
Sessions completed: ${stats.totalSessions}
Average Accuracy: ${stats.accuracy}%
Strong Topics: ${stats.strongTopics.join(', ') || 'Consistent foundations'}
Weak Topics: ${stats.weakTopics.join(', ') || 'None identified yet'}`;

  return askGroqTutor(prompt, system);
}
