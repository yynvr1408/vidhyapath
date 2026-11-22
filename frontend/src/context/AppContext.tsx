import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ContentPack, LearnerProfile, SkillState } from '../types';
import type { SupportedLang } from '../utils/translations';

export type ScreenId =
  | 'S1_PICKER'
  | 'MY_SYLLABUS'
  | 'LESSON_DETAIL'
  | 'AI_TUTOR'
  | 'PRACTICE'
  | 'PROGRESS'
  | 'PARENT_VIEW'
  | 'ADMIN'
  | 'ADMIN_PANEL'
  | 'S2_CREATE'
  | 'S3_HOME'
  | 'S4_LESSON'
  | 'S5_PRACTICE'
  | 'S7_DOUBT'
  | 'S8_PROGRESS'
  | 'S9_SETTINGS'
  | 'S10_GUARDIAN'
  | 'S11_IMPACT'
  | 'S12_PACK_EDITOR';

interface AppContextValue {
  pack: ContentPack | null;
  activeLearner: LearnerProfile | null;
  learners: LearnerProfile[];
  skillStates: Map<string, SkillState>;
  currentScreen: ScreenId;
  selectedTopicId: string | null;
  isOffline: boolean;
  simulatedOffline: boolean;
  lowDataMode: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  dataUsedKb: number;
  syncTick: boolean;
  syncPending: boolean;
  queuedDoubtsCount: number;
  offlineChapters: Set<string>;
  currentLanguage: SupportedLang;

  // Actions
  setScreen: (screen: ScreenId) => void;
  selectTopic: (topicId: string | null) => void;
  selectLearner: (learner: LearnerProfile) => void;
  createLearner: (learner: LearnerProfile) => Promise<void>;
  switchLearner: () => void;
  toggleLowDataMode: () => Promise<void>;
  toggleSimulatedOffline: () => void;
  toggleChapterOffline: (topicId: string) => void;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => Promise<void>;
  incrementDataUsage: (bytes: number) => void;
  clearAiCache: () => Promise<void>;
  refreshLearnerData: () => Promise<void>;
  triggerSync: () => Promise<void>;
  switchPack: (packId: string) => Promise<void>;
  switchLanguage: (lang: SupportedLang) => Promise<void>;
  loginWithCode: (code: string) => Promise<{ success: boolean; learner?: LearnerProfile; message?: string }>;
  updateLearnerProfile: (profile: LearnerProfile) => Promise<void>;
  updateLearnerPin: (learnerId: string, newPin: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLang = (): SupportedLang => {
    if (typeof window === 'undefined') return 'te';
    const saved = localStorage.getItem('vidyapath_language') as SupportedLang;
    if (saved && ['te', 'hi', 'en'].includes(saved)) return saved;
    return 'te';
  };

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLang>(getInitialLang);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('vidyapath_low_data') === 'true';
  });
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [dataUsedKb, setDataUsedKb] = useState<number>(34);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('ADMIN');

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

  const switchLanguage = useCallback(async (lang: SupportedLang) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyapath_language', lang);
    }
  }, []);

  const toggleLowDataMode = useCallback(async () => {
    setLowDataMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyapath_low_data', String(next));
      }
      return next;
    });
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setSimulatedOffline((prev) => !prev);
  }, []);

  const setFontSize = useCallback(async (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
  }, []);

  const incrementDataUsage = useCallback((bytes: number) => {
    setDataUsedKb((prev) => prev + Math.ceil(bytes / 1024));
  }, []);

  const clearAiCache = useCallback(async () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ai_cache_'))
        .forEach((k) => localStorage.removeItem(k));
    }
  }, []);

  const value: AppContextValue = {
    pack: null,
    activeLearner: null,
    learners: [],
    skillStates: new Map(),
    currentScreen,
    selectedTopicId: null,
    isOffline: isOffline || simulatedOffline,
    simulatedOffline,
    lowDataMode,
    fontSize,
    dataUsedKb,
    syncTick: false,
    syncPending: false,
    queuedDoubtsCount: 0,
    offlineChapters: new Set(),
    currentLanguage,

    setScreen: setCurrentScreen,
    selectTopic: () => {},
    selectLearner: () => {},
    createLearner: async () => {},
    switchLearner: () => {},
    toggleLowDataMode,
    toggleSimulatedOffline,
    toggleChapterOffline: () => {},
    setFontSize,
    incrementDataUsage,
    clearAiCache,
    refreshLearnerData: async () => {},
    triggerSync: async () => {},
    switchPack: async () => {},
    switchLanguage,
    loginWithCode: async () => ({ success: false, message: 'App mode discontinued. Please use the Web Portal.' }),
    updateLearnerProfile: async () => {},
    updateLearnerPin: async () => {},
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
