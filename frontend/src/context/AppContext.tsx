import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ContentPack, LearnerProfile, Question, Topic } from '../types';
import type { SupportedLang } from '../utils/translations';
import { getTranslations } from '../utils/translations';

export type ScreenId =
  | 'MY_SYLLABUS'
  | 'AI_TUTOR'
  | 'PRACTICE'
  | 'PROGRESS'
  | 'PARENT_VIEW';

export interface QuizAttemptRecord {
  questionId: string;
  topicId: string;
  chosenAnswer: string;
  correct: boolean;
  timestamp: number;
}

export interface AppContextValue {
  pack: ContentPack | null;
  activeLearner: LearnerProfile | null;
  learners: LearnerProfile[];
  currentScreen: ScreenId;
  selectedTopicId: string | null;
  selectedConceptId: string | null;
  completedChapters: string[];
  weakTopics: string[];
  quizAttempts: QuizAttemptRecord[];
  isOffline: boolean;
  lowDataMode: boolean;
  currentLanguage: SupportedLang;
  t: ReturnType<typeof getTranslations>;
  simulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  triggerSync: () => Promise<void>;
  syncPending: boolean;
  queuedDoubtsCount: number;
  switchPack: (packId: string) => Promise<void>;

  // Actions
  setScreen: (screen: ScreenId) => void;
  selectTopic: (topicId: string | null, conceptId?: string | null) => void;
  selectLearner: (learner: LearnerProfile) => void;
  unlockLearnerWithPin: (learnerId: string, pin: string) => boolean;
  createLearner: (profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'packId'>) => Promise<LearnerProfile>;
  switchProfile: () => void;
  toggleLowDataMode: () => void;
  toggleChapterOffline: (chapterId: string) => void;
  offlineChapters: Set<string>;
  toggleChapterCompletion: (chapterId: string) => void;
  recordQuizAttempt: (attempt: QuizAttemptRecord) => void;
  switchLanguage: (lang: SupportedLang) => void;
  refreshSyllabus: () => Promise<void>;
}

const DEFAULT_SAMPLE_PROFILES: LearnerProfile[] = [
  {
    id: 'lrn_ravi_10',
    nickname: 'Ravi',
    classGrade: 10,
    avatarEmoji: '👦',
    avatarColor: '#0F766E', // teal
    pin: '1234',
    loginCode: 'RAVI-10',
    packId: 'te-10-maths-ap',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'lrn_priya_10',
    nickname: 'Priya',
    classGrade: 10,
    avatarEmoji: '👧',
    avatarColor: '#7C3AED', // purple
    pin: '5678',
    loginCode: 'PRIYA-10',
    packId: 'te-10-maths-ap',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'lrn_aditya_10',
    nickname: 'Aditya',
    classGrade: 10,
    avatarEmoji: '👨‍🎓',
    avatarColor: '#2563EB', // blue
    pin: '4321',
    loginCode: 'ADITYA-10',
    packId: 'en-10-maths-cbse',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'lrn_ananya_10',
    nickname: 'Ananya',
    classGrade: 10,
    avatarEmoji: '👩‍🎓',
    avatarColor: '#EA580C', // orange
    pin: '8765',
    loginCode: 'ANANYA-10',
    packId: 'hi-10-maths-cbse',
    createdAt: Date.now() - 86400000 * 2,
  },
];

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLang = (): SupportedLang => {
    if (typeof window === 'undefined') return 'te';
    const saved = localStorage.getItem('vidyapath_language') as SupportedLang;
    if (saved && ['te', 'hi', 'en'].includes(saved)) return saved;
    return 'te';
  };

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLang>(getInitialLang);
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('MY_SYLLABUS');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('vidyapath_low_data') === 'true';
  });
  const [offlineChapters, setOfflineChapters] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(['ch1_real_numbers']);
    try {
      const saved = localStorage.getItem('vidyapath_offline_chapters');
      return saved ? new Set(JSON.parse(saved)) : new Set(['ch1_real_numbers']);
    } catch {
      return new Set(['ch1_real_numbers']);
    }
  });

  // Learner profiles in localStorage
  const [learners, setLearners] = useState<LearnerProfile[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_SAMPLE_PROFILES;
    try {
      const saved = localStorage.getItem('vidyapath_learners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('vidyapath_learners', JSON.stringify(DEFAULT_SAMPLE_PROFILES));
      return DEFAULT_SAMPLE_PROFILES;
    } catch {
      return DEFAULT_SAMPLE_PROFILES;
    }
  });

  const [activeLearner, setActiveLearner] = useState<LearnerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('vidyapath_active_learner');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Completed chapters & weak topics
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['ch1_real_numbers'];
    try {
      const saved = localStorage.getItem('vidyapath_completed_chapters');
      return saved ? JSON.parse(saved) : ['ch1_real_numbers'];
    } catch {
      return ['ch1_real_numbers'];
    }
  });

  const [weakTopics, setWeakTopics] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['ch2_sets'];
    try {
      const saved = localStorage.getItem('vidyapath_weak_topics');
      return saved ? JSON.parse(saved) : ['ch2_sets'];
    } catch {
      return ['ch2_sets'];
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('vidyapath_quiz_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Network online/offline listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load Content Pack according to active learner's language/pack
  const loadContentPack = useCallback(async (lang: SupportedLang) => {
    try {
      // 1. First check if a custom uploaded syllabus is live in backend
      try {
        const sylRes = await fetch('/api/syllabus');
        if (sylRes.ok) {
          const sylData = await sylRes.json();
          if (sylData && Array.isArray(sylData.chapters) && sylData.chapters.length > 0) {
            // Build a ContentPack shape from the active syllabus
            const customPack: ContentPack = {
              id: sylData.id || 'custom-uploaded-syllabus',
              version: '1.0.0',
              language: sylData.language || lang,
              languageName: sylData.language === 'te' ? 'తెలుగు (Telugu)' : sylData.language === 'hi' ? 'हिन्दी (Hindi)' : 'English',
              class: Number(sylData.classLevel) || 10,
              subject: sylData.subject || 'Mathematics',
              board: 'State SSC / CBSE',
              locales: { stt: `${lang}-IN`, tts: `${lang}-IN`, rtl: false },
              uiStrings: {},
              topics: sylData.chapters.map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                description: ch.summary,
                skills: (ch.concepts || []).map((c: any) => c.title),
                cards: (ch.concepts || []).map((c: any, idx: number) => ({
                  id: c.id || `${ch.id}_c${idx + 1}`,
                  stepNumber: idx + 1,
                  heading: c.title,
                  conceptText: c.explanation,
                  keyTakeaway: Array.isArray(c.keyPoints) && c.keyPoints.length > 0 ? c.keyPoints.join(' • ') : c.explanation,
                })),
              })),
              questions: [],
              mistakeRemedies: {},
              commonDoubts: [],
            };
            setPack(customPack);
            return;
          }
        }
      } catch {
        // Fallback to static pack
      }

      // 2. Load curated static pack from public directory
      const packFile = lang === 'hi' ? 'hi-10-maths-cbse.json' : lang === 'en' ? 'en-10-maths-cbse.json' : 'te-10-maths-ap.json';
      const res = await fetch(`/packs/${packFile}`);
      if (res.ok) {
        const data = await res.json();
        setPack(data);
      }
    } catch (err) {
      console.warn('Could not load pack, using fallback:', err);
    }
  }, []);

  useEffect(() => {
    loadContentPack(currentLanguage);
  }, [currentLanguage, loadContentPack]);

  const switchLanguage = useCallback((lang: SupportedLang) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyapath_language', lang);
    }
  }, []);

  const selectLearner = useCallback((learner: LearnerProfile) => {
    setActiveLearner(learner);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyapath_active_learner', JSON.stringify(learner));
    }
  }, []);

  const unlockLearnerWithPin = useCallback((learnerId: string, pin: string): boolean => {
    const found = learners.find((l) => l.id === learnerId);
    if (!found) return false;
    // Check PIN: matches student's PIN (or default 1234)
    if (!found.pin || found.pin === pin || pin === '1234') {
      selectLearner(found);
      return true;
    }
    return false;
  }, [learners, selectLearner]);

  const createLearner = useCallback(async (profileData: Omit<LearnerProfile, 'id' | 'createdAt' | 'packId'>): Promise<LearnerProfile> => {
    const newProfile: LearnerProfile = {
      ...profileData,
      id: `lrn_${Date.now()}`,
      createdAt: Date.now(),
      packId: currentLanguage === 'hi' ? 'hi-10-maths-cbse' : currentLanguage === 'en' ? 'en-10-maths-cbse' : 'te-10-maths-ap',
      classGrade: profileData.classGrade || 10,
    };
    const updated = [newProfile, ...learners];
    setLearners(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyapath_learners', JSON.stringify(updated));
    }
    selectLearner(newProfile);
    return newProfile;
  }, [learners, currentLanguage, selectLearner]);

  const switchProfile = useCallback(() => {
    setActiveLearner(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vidyapath_active_learner');
    }
  }, []);

  const selectTopic = useCallback((topicId: string | null, conceptId?: string | null) => {
    setSelectedTopicId(topicId);
    setSelectedConceptId(conceptId || null);
  }, []);

  const toggleChapterOffline = useCallback((chapterId: string) => {
    setOfflineChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyapath_offline_chapters', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, []);

  const toggleChapterCompletion = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => {
      const next = prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyapath_completed_chapters', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const recordQuizAttempt = useCallback((attempt: QuizAttemptRecord) => {
    setQuizAttempts((prev) => {
      const next = [attempt, ...prev].slice(0, 50);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyapath_quiz_attempts', JSON.stringify(next));
      }
      return next;
    });
    // If incorrect, add to weak topics
    if (!attempt.correct) {
      setWeakTopics((prev) => {
        if (!prev.includes(attempt.topicId)) {
          const next = [...prev, attempt.topicId];
          if (typeof window !== 'undefined') {
            localStorage.setItem('vidyapath_weak_topics', JSON.stringify(next));
          }
          return next;
        }
        return prev;
      });
    } else {
      // If correct and in weak topics, remove from weak topics
      setWeakTopics((prev) => {
        if (prev.includes(attempt.topicId)) {
          const next = prev.filter((id) => id !== attempt.topicId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('vidyapath_weak_topics', JSON.stringify(next));
          }
          return next;
        }
        return prev;
      });
    }
  }, []);

  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [queuedDoubtsCount, setQueuedDoubtsCount] = useState(0);

  const toggleSimulatedOffline = useCallback(() => {
    setSimulatedOffline((prev) => !prev);
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncPending(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setSyncPending(false);
    }
  }, []);

  const switchPack = useCallback(async (packId: string) => {
    try {
      const res = await fetch(`/packs/${packId}.json`);
      if (res.ok) {
        const data = await res.json();
        setPack(data);
      }
    } catch (err) {
      console.warn('Could not switch pack:', err);
    }
  }, []);

  const toggleLowDataMode = useCallback(() => {
    setLowDataMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyapath_low_data', String(next));
      }
      return next;
    });
  }, []);

  const t = getTranslations(currentLanguage);

  const value: AppContextValue = {
    pack,
    activeLearner,
    learners,
    currentScreen,
    selectedTopicId,
    selectedConceptId,
    completedChapters,
    weakTopics,
    quizAttempts,
    isOffline,
    lowDataMode,
    currentLanguage,
    t,
    simulatedOffline,
    toggleSimulatedOffline,
    triggerSync,
    syncPending,
    queuedDoubtsCount,
    switchPack,
    setScreen: setCurrentScreen,
    selectTopic,
    selectLearner,
    unlockLearnerWithPin,
    createLearner,
    switchProfile,
    toggleLowDataMode,
    toggleChapterOffline,
    offlineChapters,
    toggleChapterCompletion,
    recordQuizAttempt,
    switchLanguage,
    refreshSyllabus: () => loadContentPack(currentLanguage),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
