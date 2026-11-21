const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Queries Groq LLM (Llama 3.3 70B / 8B) for ultra-fast pedagogical tutor responses.
 */
export async function askGroqTutor(
  doubtText: string,
  systemPrompt: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: doubtText },
        ],
        temperature: 0.3,
        max_tokens: 280,
      }),
    });

    if (!res.ok) {
      console.warn('[Groq API] Non-200 response:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.error('[Groq API] Error querying Groq tutor:', err.message);
    return null;
  }
}

/**
 * Transcribes student voice speech using Groq Whisper (whisper-large-v3-turbo).
 */
export async function transcribeGroqWhisper(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const ext = mimeType.includes('m4a') ? 'm4a' : mimeType.includes('mp3') ? 'mp3' : 'webm';
    const filename = `voice_input.${ext}`;

    // Construct multipart form data body manually to avoid external dependencies
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const middle1 = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo'}`
    );
    const middle2 = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nte`
    );
    const middle3 = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n10th class maths Euclid lemma, sets, numbers, Telugu`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

    const payload = Buffer.concat([head, audioBuffer, middle1, middle2, middle3, tail]);

    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    if (!res.ok) {
      console.warn('[Groq Whisper] Non-200 response:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.text ? data.text.trim() : null;
  } catch (err: any) {
    console.error('[Groq Whisper] Transcription error:', err.message);
    return null;
  }
}

/**
 * Generates an automated AI progress summary using Groq LLM.
 */
export async function generateGroqStudySummary(
  nickname: string,
  accuracyPercent: number,
  strongSkills: string[],
  weakSkills: string[]
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `విద్యార్థి పేరు: ${nickname}
సగటు ఖచ్చితత్వం: ${accuracyPercent}%
బాగా వచ్చిన నైపుణ్యాలు: ${strongSkills.join(', ') || 'ప్రారంభ దశ'}
మరింత సాధన అవసరమైన నైపుణ్యాలు: ${weakSkills.join(', ') || 'ఏవీ లేవు'}

దయచేసి తల్లిదండ్రులు లేదా ఉపాధ్యాయులకు అర్థమయ్యేలా 2-3 చిన్న వాక్యాలలో సరళమైన తెలుగులో ప్రోత్సాహకరమైన సారాంశం మరియు ఒక ఆచరణాత్మక సలహా రాయండి.`;

  const system = `You are an empathetic, encouraging educator summarizing a Class 10 student's progress in Telugu. Be brief, positive, and give one concrete family practice tip. Under 80 words.`;

  return askGroqTutor(prompt, system);
}
