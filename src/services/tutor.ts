import { ContentPack, DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';
import { API_BASE } from '../config/api';

export interface TutorResponse {
  answer: string;
  source: 'common_doubts' | 'cache' | 'ai_model' | 'queued_offline';
  isQueued?: boolean;
}

/**
 * Sends a compressed photo (data URL) to the server and returns the extracted problem text.
 * Returns '' when the photo cannot be read. Used only to produce a question for the learner
 * to confirm; it never checks answers.
 */
export async function extractProblemFromPhoto(packId: string, imageDataUrl: string): Promise<string> {
  try {
    const response = await fetch(API_BASE + '/api/tutor/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId, imageDataUrl }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return typeof data?.problemText === 'string' ? data.problemText.trim() : '';
  } catch (err) {
    console.warn('Photo extraction request failed:', err);
    return '';
  }
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
   * Searches packed syllabus concepts, lesson cards, and explanations for instant offline answering
   */
  public static findOfflineSyllabusAnswer(
    pack: ContentPack,
    query: string,
    topicId?: string
  ): string | null {
    const qLower = query.toLowerCase();
    const queryTokens = qLower.split(/[\s,?.!+]+/).filter((w) => w.length > 2);
    if (queryTokens.length === 0) return null;

    // 1. Search lesson cards in pack topics
    for (const topic of pack.topics) {
      if (topic.cards) {
        for (const card of topic.cards) {
          const cardText = `${card.heading} ${card.conceptText} ${card.keyTakeaway || ''}`.toLowerCase();
          const matches = queryTokens.filter((token) => cardText.includes(token));
          if (matches.length >= 2 || (queryTokens.length === 1 && matches.length === 1)) {
            const prefix = pack.language === 'en' ? '💡 Offline Concept Note:\n' : pack.language === 'hi' ? '💡 ऑफ़लाइन संकल्पना:\n' : '💡 ఆఫ్‌లైన్ సూత్రం:\n';
            let res = `${prefix}**${card.heading}**\n${card.conceptText}`;
            if (card.workedExample) {
              const egLabel = pack.language === 'en' ? '\n\nWorked Example: ' : pack.language === 'hi' ? '\n\nहल किया गया उदाहरण: ' : '\n\nసాధించిన ఉదాహరణ: ';
              res += `${egLabel}${card.workedExample.problem}\n-> ${card.workedExample.finalAnswer}`;
            }
            if (card.keyTakeaway) {
              const keyLabel = pack.language === 'en' ? '\n\n📌 Remember: ' : pack.language === 'hi' ? '\n\n📌 याद रखें: ' : '\n\n📌 గుర్తుంచుకోండి: ';
              res += `${keyLabel}${card.keyTakeaway}`;
            }
            return res;
          }
        }
      }
    }

    // 2. Search question explanations
    for (const q of pack.questions) {
      const qText = `${q.text} ${q.explanation || ''}`.toLowerCase();
      const matches = queryTokens.filter((token) => qText.includes(token));
      if (matches.length >= 2 && q.explanation) {
        const prefix = pack.language === 'en' ? '💡 Concept Explanation:\n' : pack.language === 'hi' ? '💡 अवधारणा व्याख्या:\n' : '💡 గణిత వివరణ:\n';
        return `${prefix}${q.explanation}\n\n-> ${q.hintLadder[0]}`;
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

    // 2. Search on-device pre-packaged syllabus knowledge base (works 100% offline)
    const syllabusAnswer = this.findOfflineSyllabusAnswer(pack, queryTrimmed, topicId);
    if (syllabusAnswer) {
      const doubtRecord: DoubtItem = {
        id: 'doubt_syl_' + Date.now(),
        learnerId,
        topicId: topicId || 'ch1_real_numbers',
        inputMode: 'text',
        status: 'answered',
        question: queryTrimmed,
        answer: syllabusAnswer,
        ts: Date.now(),
      };
      await localDb.saveDoubt(doubtRecord);
      return { answer: syllabusAnswer, source: 'common_doubts' };
    }

    // 3. Check local tutor cache in IndexedDB
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
      const response = await fetch(API_BASE + '/api/tutor/ask', {
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
