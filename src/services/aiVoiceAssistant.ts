import { getApiBaseUrl } from '../config/api';

export interface VoiceAssistantResponse {
  transcript: string;
  answer: string;
  audioUrl?: string | null;
  audioBase64?: string | null;
  source: 'groq_whisper' | 'model' | 'fallback';
}

export class AiVoiceAssistantService {
  /**
   * Records audio from the user's microphone for a given duration or until stopped.
   */
  public static async recordUserVoice(maxDurationMs: number = 8000): Promise<Blob> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (err) => {
        stream.getTracks().forEach((track) => track.stop());
        reject(err);
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, maxDurationMs);
    });
  }

  /**
   * Sends audio to Groq Whisper STT + Groq LLM Tutor + ElevenLabs TTS voice pipeline.
   */
  public static async queryVoiceAssistant(
    audioBlob: Blob,
    packId: string = 'te-10-maths-ap',
    topicId?: string
  ): Promise<VoiceAssistantResponse> {
    const base = getApiBaseUrl();

    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(audioBlob);
    const audioBase64 = await base64Promise;

    const res = await fetch(`${base}/api/tutor/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        packId,
        topicId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Voice assistant server error: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Plays speech using ElevenLabs API if available, falling back to Web Speech synthesis.
   */
  public static async speakWithBestVoice(
    text: string,
    locale: string = 'te-IN',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const base = getApiBaseUrl();

    try {
      const res = await fetch(`${base}/api/tutor/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        if (audioBlob.size > 500) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          if (onStart) onStart();
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('ElevenLabs speech fetch error, falling back to on-device TTS:', e);
    }

    // Fallback to on-device SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 0.95;
      utterance.onstart = () => onStart && onStart();
      utterance.onend = () => onEnd && onEnd();
      utterance.onerror = () => onEnd && onEnd();
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  }

  /**
   * Requests Groq automated study summary for guardian or learner.
   */
  public static async getAiStudySummary(
    nickname: string,
    accuracyPercent: number,
    strongSkills: string[],
    weakSkills: string[]
  ): Promise<string> {
    const base = getApiBaseUrl();
    try {
      const res = await fetch(`${base}/api/tutor/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          accuracyPercent,
          strongSkills,
          weakSkills,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.summary || '';
      }
    } catch (err) {
      console.warn('AI summary fetch failed:', err);
    }
    return '';
  }
}
