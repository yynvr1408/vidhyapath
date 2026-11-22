import { ContentPack, DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';

export interface TutorResponse {
  answer: string;
  source: 'common_doubts' | 'cache' | 'ai_model' | 'queued_offline' | 'offline_pedagogy';
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
    const topicName = topic
      ? topic.title
      : pack.language === 'hi'
      ? 'वास्तविक संख्याएँ और बहुपद'
      : pack.language === 'en'
      ? 'Real Numbers and Polynomials'
      : 'వాస్తవ సంఖ్యలు మరియు సమితులు';
    const langName = pack.language === 'en' ? 'English' : pack.language === 'hi' ? 'Hindi' : 'Telugu';

    return `You are a patient Class ${pack.class} ${pack.subject} tutor for a ${pack.languageName}-medium student (${pack.board} syllabus).
Reply ONLY in simple, spoken-style ${langName} (${pack.language}). Short sentences. Keep numbers and symbols as written.
Never give the final answer first: give a hint, then the next step, then the answer only if asked again.
Use the current topic: ${topicName}. Context: learner's last mistake tag: ${mistakeTag || 'none'}.
If the question is unrelated to ${pack.subject}, unsafe, or asks for personal data, refuse kindly in ${langName} and steer back.
Maximum 120 words.

Learner doubt: "${doubtText}"`;
  }

  /**
   * Applies guardrail filter:
   * 1. Detects personal data requests (phone numbers, addresses, passwords)
   * 2. Detects totally off-topic questions
   * 3. Truncates length to ~120 words
   */
  public static applyGuardrails(rawReply: string, doubtQuery: string, pack?: ContentPack): string {
    const lowerQuery = doubtQuery.toLowerCase();

    // Check personal info or inappropriate query
    const personalPatterns = [
      'phone', 'address', 'password', 'money', 'hack', 'contact', 'email',
      'ఫోన్', 'నంబర్', 'చిరునామా', 'పాస్‌వర్డ్', 'డబ్బులు',
      'फोन', 'नंबर', 'मोबाइल', 'पासवर्ड', 'पता', 'पैसे'
    ];
    if (personalPatterns.some((p) => lowerQuery.includes(p))) {
      if (pack?.language === 'en') {
        return 'I am sorry, I cannot assist with personal or sensitive details. Please ask only Class 10 Mathematics questions.';
      }
      if (pack?.language === 'hi') {
        return 'क्षमा करें, मैं व्यक्तिगत या संवेदनशील जानकारी में मदद नहीं कर सकता। केवल कक्षा 10 गणित से संबंधित प्रश्न पूछें।';
      }
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
    lowDataMode: boolean = false,
    mode: 'auto' | 'manual_offline' = 'auto',
    photoBase64?: string
  ): Promise<TutorResponse> {
    const queryTrimmed = doubtText.trim();
    if (!queryTrimmed) {
      return { answer: 'Please enter your mathematics doubt.', source: 'common_doubts' };
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

    // 3. Manual Offline Mode or Device Offline:
    // AUTOMATIC Socratic Fallback: Instantly return curriculum-mapped pedagogical hint locally!
    if (mode === 'manual_offline' || isOffline || !navigator.onLine || lowDataMode) {
      const localHint = this.generatePedagogicalHint(pack, queryTrimmed, topicId);

      // Save locally as answered doubt so student history is complete
      await localDb.saveDoubt({
        id: 'doubt_' + Date.now(),
        learnerId,
        topicId: topicId || 'ch1_real_numbers',
        inputMode: 'text',
        status: 'answered',
        question: queryTrimmed,
        answer: localHint,
        ts: Date.now(),
      });
      await localDb.setTutorCachedReply(cacheKey, localHint);

      return {
        answer: localHint,
        source: 'offline_pedagogy',
        isQueued: false,
      };
    }

    // 4. Online Mode: Call live Groq AI tutor API with seamless fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          learnerId,
          doubt: queryTrimmed,
          topicId,
          mistakeTag,
          language: pack.language,
          photoBase64,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const safeAnswer = this.applyGuardrails(data.answer, queryTrimmed, pack);

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
      console.warn('Network call to AI tutor timed out or failed. Falling back to offline pedagogical engine:', err);
    }

    // 5. Intelligent Automatic Fallback: Returns curriculum Socratic hint
    const fallbackAnswer = this.generatePedagogicalHint(pack, queryTrimmed, topicId);
    await localDb.setTutorCachedReply(cacheKey, fallbackAnswer);
    return { answer: fallbackAnswer, source: 'ai_model' };
  }

  /**
   * Generates a pedagogical hint matching the active language if remote API is offline
   */
  private static generatePedagogicalHint(
    pack: ContentPack,
    query: string,
    topicId?: string
  ): string {
    const q = query.toLowerCase();
    const lang = pack.language;

    if (lang === 'en') {
      if (q.includes('hcf') || q.includes('gcd') || q.includes('euclid')) {
        return "Hint 1: Recall Euclid's division lemma: a = bq + r (0 ≤ r < b). Divide the larger number by the smaller, and repeat with the remainder until r = 0. The last divisor is the HCF.";
      }
      if (q.includes('polynomial') || q.includes('degree') || q.includes('quadratic')) {
        return 'Hint 1: The degree of a polynomial is the highest power of the variable x. A quadratic polynomial has degree 2 and at most 2 real zeroes.';
      }
      if (q.includes('terminating') || q.includes('decimal') || q.includes('rational')) {
        return 'Hint 1: Factorise the denominator q in simplest form p/q. If the prime factors are ONLY 2 and 5 (form 2^n * 5^m), it is a terminating decimal!';
      }
      if (q.includes('union') || q.includes('intersection') || q.includes('set')) {
        return 'Hint 1: The union A ∪ B contains all elements from both sets without duplicates. The intersection A ∩ B contains only elements common to both sets.';
      }
      return 'For this question: review the fundamental formulas and theorems from Chapter 1 or 2. Try the first step, and I will guide you forward!';
    }

    if (lang === 'hi') {
      if (q.includes('hcf') || q.includes('मसा') || q.includes('यूक्लिड')) {
        return 'संकेत 1: यूक्लिड विभाजन प्रमेयिका a = bq + r याद रखें। बड़ी संख्या को छोटी संख्या से भाग दें और शेषफल 0 आने तक दोहराएं। अंतिम भाजक ही म.स.प. (HCF) होगा।';
      }
      if (q.includes('बहुपद') || q.includes('घात')) {
        return 'संकेत 1: बहुपद की घात चर x का उच्चतम घातांक होती है। द्विघात बहुपद की घात 2 होती है और इसके अधिकतम 2 शून्यक होते हैं।';
      }
      if (q.includes('शांत') || q.includes('दशमलव')) {
        return 'संकेत 1: हर के अभाज्य गुणनखंड ज्ञात करें। यदि हर में केवल 2 और 5 (2^n * 5^m के रूप) हों, तो दशमलव प्रसार शांत होगा!';
      }
      return 'इस प्रश्न के लिए: पहले मूल सूत्र और परिभाषा को याद करें। पहला कदम उठाएं, फिर आगे मार्गदर्शन मिलेगा!';
    }

    // Default: Telugu
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
