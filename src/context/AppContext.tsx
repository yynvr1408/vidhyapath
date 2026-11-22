import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ContentPack, LearnerProfile, SkillState } from '../types';
import { localDb } from '../db/indexedDb';
import { SyncService } from '../services/sync';
import { SupportedLang } from '../utils/translations';

export type ScreenId =
  | 'S1_PICKER'       // Main Profile Picker / Home
  | 'MY_SYLLABUS'     // 1. My Syllabus (Learn) - Default after unlock
  | 'LESSON_DETAIL'   // Chapter Concept Cards & worked examples
  | 'AI_TUTOR'        // 2. AI Tutor (Ask Doubt)
  | 'PRACTICE'        // 3. Practice & Weak Topics
  | 'PROGRESS'        // 4. My Progress (Student View)
  | 'PARENT_VIEW'     // 5. Parent / Teacher View
  | 'ADMIN'           // 6. Admin & Curriculum Panel
  // Backwards-compatible aliases
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
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [activeLearner, setActiveLearner] = useState<LearnerProfile | null>(null);
  const activeLearnerRef = useRef<LearnerProfile | null>(null);
  activeLearnerRef.current = activeLearner;
  const [skillStates, setSkillStates] = useState<Map<string, SkillState>>(new Map());
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('S1_PICKER');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [offlineChapters, setOfflineChapters] = useState<Set<string>>(new Set(['ch1_real_numbers']));
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [dataUsedKb, setDataUsedKb] = useState<number>(34);
  const savedPack = typeof window !== 'undefined' ? localStorage.getItem('vidyapath_language_pack') : null;
  const savedLang = (typeof window !== 'undefined' ? (localStorage.getItem('vidyapath_language') as SupportedLang) : null)
    || (savedPack?.startsWith('hi') ? 'hi' : savedPack?.startsWith('en') ? 'en' : 'te');
  const [syncTick, setSyncTick] = useState<boolean>(false);
  const [queuedDoubtsCount, setQueuedDoubtsCount] = useState<number>(0);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLang>(savedLang);

  // Inactivity timer for shared-phone 2-minute auto-lock
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load active pack
  const loadPack = async (packId?: string) => {
    try {
      const activePackId = packId || localStorage.getItem('vidyapath_language_pack') || (savedLang === 'hi' ? 'hi-10-maths-cbse' : savedLang === 'en' ? 'en-10-maths-cbse' : 'te-10-maths-ap');
      const res = await fetch(`/packs/${activePackId}.json`);
      if (res.ok) {
        const data: ContentPack = await res.json();
        setPack(data);
        if (data.language.startsWith('hi')) setCurrentLanguage('hi');
        else if (data.language.startsWith('te')) setCurrentLanguage('te');
        else setCurrentLanguage('en');
      }
    } catch (err) {
      console.warn('Failed to fetch pack:', err);
    }
  };

  // Switch pack
  const switchPack = async (packId: string) => {
    localStorage.setItem('vidyapath_language_pack', packId);
    await loadPack(packId);
  };

  // Switch language directly (Telugu, Hindi, English)
  const switchLanguage = async (lang: SupportedLang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('vidyapath_language', lang);
    if (lang === 'hi') {
      await switchPack('hi-10-maths-cbse');
    } else if (lang === 'te') {
      await switchPack('te-10-maths-ap');
    } else {
      // Default to English
      await switchPack('en-10-maths-cbse');
    }
  };

  // Load real registered learners from local database & purge any legacy mock/demo accounts
  const loadExistingLearners = async () => {
    try {
      const existing = await localDb.getLearners();
      const legacyMockIds = ['learner_cheetah', 'learner_elephant', 'learner_lion', 'learner_ravi'];

      // Purge any legacy mock records from persistent IndexedDB
      for (const l of existing) {
        if (legacyMockIds.includes(l.id)) {
          await localDb.deleteLearner(l.id);
        }
      }

      const realLearners = existing.filter((l) => !legacyMockIds.includes(l.id));
      setLearners(realLearners);
    } catch (err) {
      console.warn('Failed to load real learners:', err);
      setLearners([]);
    }
  };

  // Load skill states for active learner
  const loadLearnerSkills = useCallback(async (learnerId: string) => {
    const states = await localDb.getAllSkillStates(learnerId);
    const map = new Map<string, SkillState>();
    for (const s of states) {
      map.set(s.skillId, s);
    }
    setSkillStates(map);

    const queuedCount = await localDb.getQueuedDoubtsCount(learnerId);
    setQueuedDoubtsCount(queuedCount);
  }, []);

  // Initialize
  useEffect(() => {
    const savedPack = localStorage.getItem('vidyapath_language_pack') || 'te-10-maths-ap';
    loadPack(savedPack);
    loadExistingLearners();

    // Load persisted settings
    localDb.getSetting<boolean>('lowDataMode', false).then(setLowDataMode);
    localDb.getSetting<'normal' | 'large' | 'xlarge'>('fontSize', 'normal').then(setFontSizeState);
    localDb.getSetting<number>('dataUsedKb', 34).then(setDataUsedKb);
    localDb.getSetting<string[]>('offline_chapters', ['ch1_real_numbers']).then((arr) => {
      if (arr && Array.isArray(arr)) setOfflineChapters(new Set(arr));
    });

    // Online / Offline listeners
    const handleOnline = () => {
      setIsOffline(false);
      triggerSync();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toggle chapter offline download
  const toggleChapterOffline = (topicId: string) => {
    setOfflineChapters((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      localDb.setSetting('offline_chapters', Array.from(next));
      return next;
    });
  };

  // Toggle simulated offline mode
  const toggleSimulatedOffline = () => {
    setSimulatedOffline((prev) => !prev);
  };

  // Shared-phone 2-minute auto-lock
  const resetInactivityTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }

    // Only auto-lock if currently inside a student profile
    if (activeLearner && currentScreen !== 'S1_PICKER') {
      autoLockTimerRef.current = setTimeout(() => {
        console.log('Shared-phone 2-minute auto-lock triggered.');
        setActiveLearner(null);
        setCurrentScreen('S1_PICKER');
      }, 120000); // 2 minutes
    }
  }, [activeLearner, currentScreen]);

  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [resetInactivityTimer]);

  const selectLearner = (learner: LearnerProfile) => {
    setActiveLearner(learner);
    setSkillStates(new Map());
    loadLearnerSkills(learner.id);
    if (learner.packId) {
      loadPack(learner.packId);
    }
    setCurrentScreen('MY_SYLLABUS'); // Default landing page after unlocking profile!
  };

  const loginWithCode = async (code: string): Promise<{ success: boolean; learner?: LearnerProfile; message?: string }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'దయచేసి మీ ప్రత్యేక కోడ్‌ను నమోదు చేయండి.' };
    }
    const matched = await localDb.findLearnerByLoginCode(clean);
    if (matched) {
      selectLearner(matched);
      return { success: true, learner: matched };
    }
    return {
      success: false,
      message: 'ఈ కోడ్‌తో ఏ ప్రొఫైల్ కనుగొనబడలేదు. దయచేసి కోడ్‌ను సరిచూసుకోండి.'
    };
  };

  const createLearner = async (learner: LearnerProfile) => {
    try {
      await localDb.saveLearner(learner);
      const updated = await localDb.getLearners();
      setLearners(updated);
      selectLearner(learner);
    } catch (err) {
      console.warn('Failed to save learner:', err);
    }
  };

  const updateLearnerProfile = async (profile: LearnerProfile) => {
    try {
      await localDb.saveLearner(profile);
      const updated = await localDb.getLearners();
      setLearners(updated);
      if (activeLearnerRef.current && activeLearnerRef.current.id === profile.id) {
        setActiveLearner(profile);
      }
    } catch (err) {
      console.warn('Failed to update learner:', err);
    }
  };

  const switchLearner = () => {
    setActiveLearner(null);
    setSkillStates(new Map());
    setQueuedDoubtsCount(0);
    setCurrentScreen('S1_PICKER');
  };

  const toggleLowDataMode = async () => {
    const next = !lowDataMode;
    setLowDataMode(next);
    await localDb.setSetting('lowDataMode', next);
  };

  const setFontSize = async (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    await localDb.setSetting('fontSize', size);
  };

  const incrementDataUsage = (bytes: number) => {
    const addedKb = Math.ceil(bytes / 1024);
    setDataUsedKb((prev) => {
      const next = prev + addedKb;
      localDb.setSetting('dataUsedKb', next);
      return next;
    });
  };

  const clearAiCache = async () => {
    await localDb.clearTutorCache();
  };

  const refreshLearnerData = async () => {
    if (activeLearner) {
      await loadLearnerSkills(activeLearner.id);
    }
  };

  const triggerSync = async () => {
    const learner = activeLearnerRef.current;
    if (!learner) return;
    const res = await SyncService.syncOutbox(learner.id, pack?.version);
    if (res.syncedEventsCount > 0 || res.answeredDoubts.length > 0) {
      setSyncTick(true);
      setTimeout(() => setSyncTick(false), 3000);
      await refreshLearnerData();
    }
  };

  const updateLearnerPin = async (learnerId: string, newPin: string) => {
    const updatedLearners = learners.map((l) => {
      if (l.id === learnerId) {
        return { ...l, pin: newPin, pinHash: newPin };
      }
      return l;
    });
    setLearners(updatedLearners);
    const target = updatedLearners.find((l) => l.id === learnerId);
    if (target) {
      await localDb.saveLearner(target);
      if (activeLearnerRef.current?.id === learnerId) {
        setActiveLearner(target);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        pack,
        activeLearner,
        learners,
        skillStates,
        currentScreen,
        selectedTopicId,
        isOffline: isOffline || simulatedOffline,
        simulatedOffline,
        lowDataMode,
        fontSize,
        dataUsedKb,
        syncTick,
        queuedDoubtsCount,
        offlineChapters,
        currentLanguage,
        setScreen: setCurrentScreen,
        selectTopic: setSelectedTopicId,
        selectLearner,
        createLearner,
        switchLearner,
        toggleLowDataMode,
        toggleSimulatedOffline,
        toggleChapterOffline,
        setFontSize,
        incrementDataUsage,
        clearAiCache,
        refreshLearnerData,
        triggerSync,
        switchPack,
        switchLanguage,
        loginWithCode,
        updateLearnerProfile,
        updateLearnerPin,
      }}
    >
      <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0F172A]">
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
