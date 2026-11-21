const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

/**
 * Synthesizes high-fidelity voice audio using ElevenLabs multilingual v2.
 */
export async function synthesizeElevenLabsVoice(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / multilingual

  try {
    const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      console.warn('[ElevenLabs] Non-200 response:', res.status, await res.text());
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.error('[ElevenLabs] Speech generation error:', err.message);
    return null;
  }
}
