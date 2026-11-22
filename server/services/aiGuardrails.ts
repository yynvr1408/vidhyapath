// Responsible AI Governance & Student Safety Guardrails Service
import { dataStore } from '../db/store.js';

export interface GuardrailCheckResult {
  allowed: boolean;
  blockedReason?: string;
  flagCategory?: 'exam_cheating' | 'answer_dumping' | 'prompt_injection' | 'pii_request' | 'rate_limit';
  sanitizedQuery?: string;
  pedagogicalNudge?: string;
}

// Student daily query counter
interface DailyQuotaTracker {
  date: string;
  count: number;
}
const studentQuotaMap = new Map<string, DailyQuotaTracker>();

export class AiGuardrailService {
  private static EXAM_CHEATING_PATTERNS = [
    /\b(exam|test|quiz|mid-term|final exam|board exam|paper)\s+(answer|leak|solution|key)\b/i,
    /\b(solve|answer)\s+this\s+(in\s+my\s+exam|during\s+my\s+test|right\s+now\s+for\s+exam)\b/i,
    /\b(cheating|bypass\s+exam|hack\s+exam|copy\s+answers)\b/i,
    /\b(give\s+me\s+answers\s+for\s+question\s+[0-9]+)\b/i,
  ];

  private static ANSWER_DUMPING_PATTERNS = [
    /\b(just\s+give\s+me\s+the\s+direct\s+answer|don'?t\s+explain\s+just\s+answer|only\s+the\s+answer)\b/i,
    /\b(write\s+my\s+entire\s+assignment|do\s+my\s+homework\s+for\s+me)\b/i,
  ];

  private static PROMPT_INJECTION_PATTERNS = [
    /\b(ignore\s+(all\s+)?previous\s+instructions|disregard\s+(all\s+)?prior\s+rules)\b/i,
    /\b(what\s+is\s+your\s+system\s+prompt|reveal\s+your\s+(instructions|prompt|secret))\b/i,
    /\b(jailbreak|DAN\s+mode|act\s+as\s+unrestricted)\b/i,
    /\b(system\s+instructions:|override\s+safety)\b/i,
  ];

  private static PII_PATTERNS = [
    /\b(phone\s+number|mobile\s+number|password|credit\s+card|aadhaar|pan\s+card|otp)\b/i,
    /\b(give\s+me\s+student\s+personal\s+data|teacher\s+private\s+info)\b/i,
    /\b(\d{10}|\d{12})\b/, // Raw 10 or 12 digit numbers
  ];

  static inspectQuery(
    userId: string,
    query: string,
    institutionId?: string,
    role: string = 'student'
  ): GuardrailCheckResult {
    const trimmed = query.trim();

    // 1. Daily Query Quota for Students (default 30 queries/day)
    if (role === 'student') {
      const today = new Date().toISOString().slice(0, 10);
      const tracker = studentQuotaMap.get(userId) || { date: today, count: 0 };
      if (tracker.date !== today) {
        tracker.date = today;
        tracker.count = 0;
      }

      const policy = institutionId ? dataStore.institutions.get(institutionId)?.aiPolicy : null;
      const maxDaily = policy?.maxDailyQueriesStudent || 30;

      if (tracker.count >= maxDaily) {
        return {
          allowed: false,
          flagCategory: 'rate_limit',
          blockedReason: `You have reached your daily AI assistance quota (${maxDaily} queries). This ensures independent study time. Quota resets tomorrow.`,
        };
      }
    }

    // 2. Exam Integrity Protection
    for (const pattern of this.EXAM_CHEATING_PATTERNS) {
      if (pattern.test(trimmed)) {
        dataStore.logAudit({
          userId,
          institutionId,
          category: 'ai_guardrail',
          action: 'EXAM_CHEATING_ATTEMPT_BLOCKED',
          details: { querySnippet: trimmed.slice(0, 80) },
        });

        return {
          allowed: false,
          flagCategory: 'exam_cheating',
          blockedReason: 'Academic Integrity Notice: Vidyapath AI cannot assist during active examinations or provide direct test answer keys. Please ask conceptual questions instead.',
        };
      }
    }

    // 3. Prompt Injection Defense
    for (const pattern of this.PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        dataStore.logAudit({
          userId,
          institutionId,
          category: 'ai_guardrail',
          action: 'PROMPT_INJECTION_BLOCKED',
          details: { querySnippet: trimmed.slice(0, 80) },
        });

        return {
          allowed: false,
          flagCategory: 'prompt_injection',
          blockedReason: 'Security Notice: System prompt extraction and instruction override commands are prohibited.',
        };
      }
    }

    // 4. Privacy & PII Guardrail
    for (const pattern of this.PII_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          flagCategory: 'pii_request',
          blockedReason: 'Privacy Protection: Vidyapath AI does not process personal phone numbers, passwords, or private contact details.',
        };
      }
    }

    // 5. Homework Answer Dumping Check -> Convert into Socratic Nudge
    for (const pattern of this.ANSWER_DUMPING_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          allowed: true,
          pedagogicalNudge: 'Instead of solving your entire assignment directly, I will guide you through the core concept so you can solve it yourself. What is the first formula or step you think applies here?',
        };
      }
    }

    // Record usage
    if (role === 'student') {
      const today = new Date().toISOString().slice(0, 10);
      const tracker = studentQuotaMap.get(userId) || { date: today, count: 0 };
      tracker.count += 1;
      studentQuotaMap.set(userId, tracker);
    }

    return { allowed: true, sanitizedQuery: trimmed };
  }

  // Construct Socratic Pedagogical Prompt with Dynamic Grade, Board, and Trilingual Curriculum Grounding
  static buildPedagogicalSystemPrompt(
    subjectName: string,
    unitTitle?: string,
    topicTitle?: string,
    classGrade?: number,
    board?: string,
    state?: string,
    teachingLanguage?: string
  ): string {
    const langKey = teachingLanguage === 'te' ? 'Telugu' : teachingLanguage === 'hi' ? 'Hindi' : 'English';
    const grade = classGrade || 10;
    const boardName = board || (grade <= 10 ? 'State SSC / CBSE' : 'CBSE / University');
    const stateName = state || 'India';

    let pedagogyAdvice = '';
    if (grade <= 5) {
      pedagogyAdvice =
        'PEDAGOGY (Primary Class 1-5): The student is a young primary learner. Use gentle, joyful encouragement, everyday relatable analogies (e.g., counting fruits, sharing sweets), short simple sentences, and visual explanations.';
    } else if (grade <= 8) {
      pedagogyAdvice =
        'PEDAGOGY (Middle School Class 6-8): Foster mathematical curiosity. Ask guiding questions about definitions and formula intuition, helping them discover the logic step-by-step.';
    } else if (grade <= 10) {
      pedagogyAdvice =
        `PEDAGOGY (Secondary Board Exam Prep Class ${grade} ${boardName} ${stateName}): Maintain high academic rigor aligned with board syllabus criteria. Never solve the whole problem at once; break it into logical steps, remind them of core theorems, and prompt them to take the next step.`;
    } else {
      pedagogyAdvice =
        `PEDAGOGY (Senior Secondary / Higher Ed Class ${grade}): Cultivate deep analytical derivations, conceptual mastery, and structured reasoning suitable for higher examinations.`;
    }

    return `You are Vidyapath's Socratic AI Tutor for ${subjectName} (Class ${grade}, Board: ${boardName}, Region: ${stateName}).
${unitTitle ? `Current Unit: ${unitTitle}\n` : ''}${topicTitle ? `Topic: ${topicTitle}\n` : ''}
${pedagogyAdvice}

RULES OF ENGAGEMENT:
1. Socratic Method: Guide the student with leading questions and hints. NEVER dump the complete final answer immediately on the first prompt.
2. Language: Reply EXCLUSIVELY in ${langKey} (strictly one of the 3 core teaching mediums: Telugu, Hindi, or English).
3. Brevity & Tone: Keep explanations concise (under 120 words), clear, and warmly supportive.
4. Curriculum Integrity: Reference standard SCERT / NCERT concepts and verified mathematical definitions.`;
  }
}
