export * from './enterprise';

export interface PackLocales {
  stt: string;
  tts: string;
  rtl: boolean;
}

export interface Topic {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  skills: string[];
  cards?: LessonCard[];
}

export interface LessonCard {
  id: string;
  stepNumber: number;
  heading: string;
  conceptText: string;
  workedExample?: {
    problem: string;
    steps: string[];
    finalAnswer: string;
  };
  keyTakeaway: string;
}

export interface Question {
  id: string;
  skillId: string;
  difficulty: 1 | 2 | 3; // 1: easy (<0.4), 2: medium (0.4-0.7), 3: hard (>0.7)
  text: string;
  options: string[]; // 4 options [A, B, C, D]
  answer: 'A' | 'B' | 'C' | 'D';
  acceptedForms: string[]; // e.g. ["12", "పన్నెండు", "12 cm"]
  hintLadder: [string, string, string]; // [nudge, method, worked step]
  distractorMistakes: Record<string, string>; // e.g. { "A": "forgot_remainder", "C": "sign_error" }
  explanation?: string;
}

export interface CommonDoubt {
  id: string;
  topicId: string;
  q: string;
  a: string;
  keywords?: string[];
}

export interface ContentPack {
  id: string;
  version: string;
  language: string;
  languageName: string;
  class: number;
  subject: string;
  board: string;
  locales: PackLocales;
  uiStrings: Record<string, string>;
  topics: Topic[];
  questions: Question[];
  mistakeRemedies: Record<string, string>;
  commonDoubts: CommonDoubt[];
  isStub?: boolean;
}

export interface LearnerProfile {
  id: string;
  nickname: string; // Student first/display name (e.g. రవి / Ravi)
  classGrade?: number; // e.g. 9 or 10
  avatarType?: 'initials' | 'icon' | 'photo';
  avatarColor: string; // Theme ring / badge background color
  avatarEmoji?: string; // Student icon preset (e.g. 👦, 👧, 👩‍🎓, 👨‍🎓, 🧑‍🎓, 🧒)
  avatarPhoto?: string | null; // 160x160 Data URL (< 25 KB)
  animal?: string; // legacy fallback
  packId: string;
  loginCode: string; // Unique student code (e.g. RAVI-09, PRIYA-10)
  pin?: string; // 4-digit PIN (e.g. "1234")
  pinHash?: string | null;
  securityQuestionId?: string; // e.g. "subject" | "animal" | "fruit" | "sport" | "friend"
  securityQuestion?: string; // Custom or localized question prompt
  securityAnswer?: string; // Localized plain text answer for zero-email PIN recovery
  createdAt: number;
  cohortCode?: string;
}

export interface AttemptEvent {
  eventId: string;
  learnerId: string;
  questionId: string;
  skillId: string;
  chosenAnswer: string;
  correct: boolean;
  mistakeTag?: string | null;
  hintsUsed: number;
  timeMs: number;
  inputMode: 'tap' | 'voice';
  ts: number;
}

export interface SkillState {
  learnerId: string;
  skillId: string;
  mastery: number; // 0.0 to 1.0, starts at 0.3
  streak: number;
  consecutiveCorrectLowHints: number; // for mastery definition: >= 3 consecutive with <= 1 hint
  lastSeen: number;
}

export interface DoubtItem {
  id: string;
  learnerId: string;
  topicId: string;
  inputMode: 'text' | 'voice' | 'photo';
  status: 'queued' | 'answered';
  question: string;
  answer?: string;
  photoUrl?: string;
  ts: number;
}

export interface GuardianTokenData {
  token: string;
  learnerId: string;
  learnerNickname: string;
  learnerAnimal: string;
  packId: string;
  scope: 'view-only';
  expiresAt: number;
  summary: {
    week: string;
    sessionsCompleted: number;
    accuracyPercent: number;
    strongSkills: string[];
    weakSkills: string[];
    weakTopicName: string;
    suggestedAction: string;
    practiceTogetherPrompt: string;
  };
}

export interface CohortAggregate {
  cohortId: string;
  cohortName: string;
  sponsorName: string;
  activeLearners: number;
  sessionsCompleted: number;
  avgMasteryGain: number; // percentage, e.g. 38%
  offlineSessionsPercent: number;
  costPerLearner: number; // INR
  weakTopics: { topic: string; errorRate: number }[];
  weeklyActivity: { day: string; activeCount: number }[];
}

export interface SyncPayload {
  learnerId: string;
  events: AttemptEvent[];
  doubts: DoubtItem[];
  clientPackVersion: string;
  language?: 'te' | 'hi' | 'en';
}

export interface SyncResponse {
  success: boolean;
  durable: boolean;
  syncedEventsCount: number;
  syncedEventIds: string[];
  answeredDoubts: DoubtItem[];
  latestPackVersion: string;
  packUpdateAvailable: boolean;
}
