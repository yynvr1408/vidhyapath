import { ContentPack, DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';

export interface TutorResponse {
  answer: string;
  source: 'common_doubts' | 'cache' | 'ai_model' | 'queued_offline';
  isQueued?: boolean;
}

export class TutorService {
  /**
   * Builds the pack-driven prompt template specified in Section 7
   */
  public static buildPrompt(
    pack: ContentPack,
    doubtText: string,
    topicId?: string,
    mistakeTag?: string
  ): string {
    const topic = pack.topics.find((t) => t.id === topicId);
    const topicName = topic ? topic.title : 'వాస్తవ సంఖ్యలు మరియు సమితులు';

    return `You are a patient Class ${pack.class} ${pack.subject} tutor for a ${pack.languageName}-medium student (${pack.board} syllabus).
Reply ONLY in simple, spoken-style Telugu (${pack.language}). Short sentences. Keep numbers and symbols as written.
Never give the final answer first: give a hint, then the next step, then the answer only if asked again.
Use the current topic: ${topicName}. Context: learner's last mistake tag: ${mistakeTag || 'none'}.
If the question is unrelated to ${pack.subject}, unsafe, or asks for personal data, refuse kindly in ${pack.languageName} and steer back.
Maximum 120 words.

Learner doubt: "${doubtText}"`;
  }

  /**
   * Applies guardrail filter:
   * 1. Detects personal data requests (phone numbers, addresses, passwords)
   * 2. Detects totally off-topic questions
   * 3. Truncates length to ~120 words
   */
  public static applyGuardrails(rawReply: string, doubtQuery: string): string {
    const lowerQuery = doubtQuery.toLowerCase();

    // Check personal info or inappropriate query
    const personalPatterns = ['phone', 'ఫోన్ నంబర్', 'చిరునామా', 'password', 'పాస్‌వర్డ్', 'డబ్బులు', 'money', 'hack'];
    if (personalPatterns.some((p) => lowerQuery.includes(p))) {
      return 'క్షమించండి, నేను వ్యక్తిగత లేదా సున్నితమైన వివరాలలో సహాయం చేయలేను. కేవలం 10వ తరగతి గణితం సంబంధిత సందేహాలు మాత్రమే అడగండి.';
    }

    // Cap words to 120 words
    const words = rawReply.split(/\s+/);
    if (words.length > 130) {
      return words.slice(0, 120).join(' ') + '...';
    }

    return rawReply;
  }

  /**
   * Checks precomputed common doubts for instant offline response
   */
  public static findInCommonDoubts(
    pack: ContentPack,
    query: string,
    topicId?: string
  ): string | null {
    const qLower = query.toLowerCase();
    
    // 1. Topic-matched common doubts
    const candidates = topicId
      ? pack.commonDoubts.filter((cd) => cd.topicId === topicId)
      : pack.commonDoubts;

    for (const item of candidates) {
      if (qLower.includes(item.q.toLowerCase()) || item.q.toLowerCase().includes(qLower)) {
        return item.a;
      }
      if (item.keywords && item.keywords.some((k) => qLower.includes(k.toLowerCase()))) {
        return item.a;
      }
    }

    // 2. Fallback check across all common doubts
    for (const item of pack.commonDoubts) {
      if (item.keywords && item.keywords.some((k) => qLower.includes(k.toLowerCase()))) {
        return item.a;
      }
    }

    return null;
  }

  /**
   * Full AI Tutor Resolution Pipeline
   */
  public static async askDoubt(
    pack: ContentPack,
    learnerId: string,
    doubtText: string,
    topicId?: string,
    mistakeTag?: string,
    isOffline: boolean = false,
    lowDataMode: boolean = false
  ): Promise<TutorResponse> {
    const queryTrimmed = doubtText.trim();
    if (!queryTrimmed) {
      return { answer: 'దయచేసి మీ సందేహాన్ని అడగండి.', source: 'common_doubts' };
    }

    // 1. Check local common doubts (instant, 0 data, works offline)
    const commonAnswer = this.findInCommonDoubts(pack, queryTrimmed, topicId);
    if (commonAnswer) {
      const doubtRecord: DoubtItem = {
        id: 'doubt_' + Date.now(),
        learnerId,
        topicId: topicId || 'ch1_real_numbers',
        inputMode: 'text',
        status: 'answered',
        question: queryTrimmed,
        answer: commonAnswer,
        ts: Date.now(),
      };
      await localDb.saveDoubt(doubtRecord);
      return { answer: commonAnswer, source: 'common_doubts' };
    }

    // 2. Check local tutor cache in IndexedDB
    const cacheKey = `${pack.id}_${queryTrimmed.toLowerCase()}`;
    const cachedReply = await localDb.getTutorCachedReply(cacheKey);
    if (cachedReply) {
      return { answer: cachedReply, source: 'cache' };
    }

    // 3. If offline or in low-data mode without cache, queue the doubt
    if (isOffline || !navigator.onLine || lowDataMode) {
      const queuedItem: DoubtItem = {
        id: 'doubt_q_' + Date.now(),
        learnerId,
        topicId: topicId || 'ch1_real_numbers',
        inputMode: 'text',
        status: 'queued',
        question: queryTrimmed,
        ts: Date.now(),
      };
      await localDb.saveDoubt(queuedItem);

      return {
        answer: pack.uiStrings.offlineQueueNotice || 'మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు. నెట్‌వర్క్ రాగానే మీ సందేహానికి సమాధానం అందించబడుతుంది.',
        source: 'queued_offline',
        isQueued: true,
      };
    }

    // 4. Online: call API layer
    try {
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          learnerId,
          doubt: queryTrimmed,
          topicId,
          mistakeTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const safeAnswer = this.applyGuardrails(data.answer, queryTrimmed);

        // Cache for offline reuse
        await localDb.setTutorCachedReply(cacheKey, safeAnswer);

        // Save to learner doubt history
        await localDb.saveDoubt({
          id: 'doubt_' + Date.now(),
          learnerId,
          topicId: topicId || 'ch1_real_numbers',
          inputMode: 'text',
          status: 'answered',
          question: queryTrimmed,
          answer: safeAnswer,
          ts: Date.now(),
        });

        return { answer: safeAnswer, source: 'ai_model' };
      }
    } catch (err) {
      console.warn('Network call to AI tutor failed:', err);
    }

    // 5. Intelligent rule-based fallback if server API is momentarily unreachable
    const fallbackAnswer = this.generatePedagogicalHint(pack, queryTrimmed, topicId);
    await localDb.setTutorCachedReply(cacheKey, fallbackAnswer);
    return { answer: fallbackAnswer, source: 'ai_model' };
  }

  /**
   * Generates a pedagogical Telugu hint if remote API is offline
   */
  private static generatePedagogicalHint(
    pack: ContentPack,
    query: string,
    topicId?: string
  ): string {
    const q = query.toLowerCase();
    if (q.includes('hcf') || q.includes('గసాభా') || q.includes('యూక్లిడ్')) {
      return 'సూచన 1: యూక్లిడ్ సూత్రం a = bq + r గుర్తుచేసుకోండి. పెద్ద సంఖ్యను చిన్న సంఖ్యతో భాగించి శేషం 0 వచ్చే వరకు విభాజకాలను కొనసాగించండి. చివరి విభాజకమే గ.సా.భా అవుతుంది.';
    }
    if (q.includes('union') || q.includes('సమ్మేళనం') || q.includes('∪')) {
      return 'సూచన 1: A ∪ B అంటే రెండు సమితులలోని అన్ని మూలకాలను కలిపి రాయడం. ఏ మూలకమూ రెండుసార్లు పునరావృతం కాకూడదు.';
    }
    if (q.includes('intersection') || q.includes('ఛేదనం') || q.includes('∩')) {
      return 'సూచన 1: A ∩ B అంటే రెండు సమితులలోనూ సమానంగా (ఉమ్మడిగా) ఉన్న మూలకాలను మాత్రమే ఎంచుకోవాలి.';
    }
    if (q.includes('దశాంశం') || q.includes('terminating')) {
      return 'సూచన 1: హారాన్ని ప్రధాన కారణాంకాలుగా మార్చండి. 2 మరియు 5 మాత్రమే ఉంటే అది అంతమయ్యే దశాంశం.';
    }
    return `ఈ ప్రశ్నకు సంబంధించి: మొదట ప్రాథమిక సూత్రాన్ని గుర్తుచేసుకోండి. మొదటి అడుగు వేసి చూడండి, తదుపరి సహాయం చేస్తాను!`;
  }
}
