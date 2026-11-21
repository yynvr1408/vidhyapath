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
  // Backwards-compatible aliases
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
  const [syncTick, setSyncTick] = useState<boolean>(false);
  const [queuedDoubtsCount, setQueuedDoubtsCount] = useState<number>(0);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLang>('te');

  // Inactivity timer for shared-phone 2-minute auto-lock
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load active pack
  const loadPack = async (packId: string = 'te-10-maths-ap') => {
    try {
      const res = await fetch(`/packs/${packId}.json`);
      if (res.ok) {
        const data: ContentPack = await res.json();
        setPack(data);
        if (data.language.startsWith('en')) setCurrentLanguage('en');
        else if (data.language.startsWith('hi')) setCurrentLanguage('hi');
        else setCurrentLanguage('te');
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

  // Switch language directly
  const switchLanguage = async (lang: SupportedLang) => {
    setCurrentLanguage(lang);
    if (lang === 'en') {
      await switchPack('en-10-maths-cbse');
    } else if (lang === 'hi') {
      await switchPack('hi-10-maths-cbse');
    } else {
      await switchPack('te-10-maths-ap');
    }
  };

  // Seed default learners if first run and clean legacy animal profiles
  const seedDefaultLearners = async () => {
    try {
      const existing = await localDb.getLearners();

      // Check and delete any legacy profiles with animal names, ids, or animal emojis
      const ANIMAL_PATTERN = /చిరుత|ఏనుగు|జింక|cheetah|elephant|deer|chiruta|leopard|tiger|lion|peacock|nemali|జంతు/i;
      const ANIMAL_EMOJIS = ['🐆', '🐘', '🦌', '🐅', '🦁', '🦚', '🐯', '🦊', '🐺', '🐾'];

      const cleanedLearners: LearnerProfile[] = [];
      for (const l of existing) {
        const isAnimal =
          ANIMAL_PATTERN.test(l.nickname || '') ||
          ANIMAL_PATTERN.test(l.id || '') ||
          (l.animal && ANIMAL_PATTERN.test(l.animal)) ||
          ANIMAL_EMOJIS.includes(l.avatarEmoji || '');

        if (isAnimal) {
          // Permanently purge animal-named record from IndexedDB
          await localDb.deleteLearner(l.id);
        } else {
          cleanedLearners.push(l);
        }
      }

      // Standard human student profiles representing siblings/learners sharing the phone
      const defaultHumanLearners: LearnerProfile[] = [
        {
          id: 'learner_ravi',
          nickname: 'Ravi / రవి',
          classGrade: 9,
          avatarType: 'icon',
          avatarColor: '#0F766E', // Primary Educational Teal
          avatarEmoji: '👦', // School Boy
          packId: 'te-10-maths-ap',
          loginCode: 'RAVI-09',
          pin: '1234',
          pinHash: '1234',
          createdAt: Date.now() - 3600 * 1000 * 24 * 4,
        },
        {
          id: 'learner_priya',
          nickname: 'Priya / ప్రియ',
          classGrade: 10,
          avatarType: 'icon',
          avatarColor: '#D97706', // Warm Amber
          avatarEmoji: '👩‍🎓', // Graduate Girl
          packId: 'te-10-maths-ap',
          loginCode: 'PRIYA-10',
          pin: '1234',
          pinHash: '1234',
          createdAt: Date.now() - 3600 * 1000 * 24 * 3,
        },
        {
          id: 'learner_lakshmi',
          nickname: 'Lakshmi / లక్ష్మి',
          classGrade: 9,
          avatarType: 'icon',
          avatarColor: '#16A34A', // Leaf Green
          avatarEmoji: '👧', // School Girl
          packId: 'te-10-maths-ap',
          loginCode: 'LAKSHMI-09',
          pin: '1234',
          pinHash: '1234',
          createdAt: Date.now() - 3600 * 1000 * 24 * 2,
        },
        {
          id: 'learner_arjun',
          nickname: 'Arjun / అర్జున్',
          classGrade: 10,
          avatarType: 'icon',
          avatarColor: '#0F766E', // Primary Educational Teal
          avatarEmoji: '👨‍🎓', // Graduate Boy
          packId: 'te-10-maths-ap',
          loginCode: 'ARJUN-10',
          pin: '1234',
          pinHash: '1234',
          createdAt: Date.now() - 3600 * 1000 * 12,
        },
      ];

      // Ensure each default human learner exists
      for (const def of defaultHumanLearners) {
        const found = cleanedLearners.find((c) => c.loginCode === def.loginCode || c.id === def.id);
        if (!found) {
          await localDb.saveLearner(def);
          cleanedLearners.push(def);
        } else {
          // Ensure human avatar emoji & pin
          let changed = false;
          if (!found.avatarEmoji || ANIMAL_EMOJIS.includes(found.avatarEmoji)) {
            found.avatarEmoji = def.avatarEmoji;
            changed = true;
          }
          if (!found.pin) {
            found.pin = '1234';
            found.pinHash = '1234';
            changed = true;
          }
          if (!found.classGrade) {
            found.classGrade = def.classGrade;
            changed = true;
          }
          if (changed) {
            await localDb.saveLearner(found);
          }
        }
      }

      setLearners(cleanedLearners);

      // Reset activeLearner if it was an animal profile
      if (activeLearner) {
        const isCurrentAnimal =
          ANIMAL_PATTERN.test(activeLearner.nickname || '') ||
          ANIMAL_PATTERN.test(activeLearner.id || '') ||
          ANIMAL_EMOJIS.includes(activeLearner.avatarEmoji || '');
        if (isCurrentAnimal) {
          setActiveLearner(cleanedLearners[0] || null);
        }
      }
    } catch (err) {
      console.warn('Error seeding learners:', err);
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
    seedDefaultLearners();

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
    loadLearnerSkills(learner.id);
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
