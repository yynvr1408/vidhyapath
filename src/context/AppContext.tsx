import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ContentPack, LearnerProfile, SkillState } from '../types';
import { localDb } from '../db/indexedDb';
import { SyncService } from '../services/sync';

export type ScreenId =
  | 'S1_PICKER'
  | 'S2_CREATE'
  | 'S3_HOME'
  | 'S4_LESSON'
  | 'S5_PRACTICE'
  | 'S7_DOUBT'
  | 'S8_PROGRESS'
  | 'S9_SETTINGS'
  | 'S10_GUARDIAN'
  | 'S11_IMPACT'
  | 'S12_PACK_EDITOR'
  | 'S13_COHORT';

interface AppContextValue {
  pack: ContentPack | null;
  activeLearner: LearnerProfile | null;
  learners: LearnerProfile[];
  skillStates: Map<string, SkillState>;
  currentScreen: ScreenId;
  selectedTopicId: string | null;
  isOffline: boolean;
  lowDataMode: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  dataUsedKb: number;
  syncTick: boolean;
  queuedDoubtsCount: number;
  // Actions
  setScreen: (screen: ScreenId) => void;
  selectTopic: (topicId: string | null) => void;
  selectLearner: (learner: LearnerProfile) => void;
  createLearner: (learner: LearnerProfile) => Promise<void>;
  switchLearner: () => void;
  toggleLowDataMode: () => Promise<void>;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => Promise<void>;
  incrementDataUsage: (bytes: number) => void;
  clearAiCache: () => Promise<void>;
  refreshLearnerData: () => Promise<void>;
  triggerSync: () => Promise<void>;
  switchPack: (packId: string) => Promise<void>;
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
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [dataUsedKb, setDataUsedKb] = useState<number>(34); // initial baseline KB
  const [syncTick, setSyncTick] = useState<boolean>(false);
  const [queuedDoubtsCount, setQueuedDoubtsCount] = useState<number>(0);

  // Inactivity timer for shared-phone 2-minute auto-lock
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load active pack
  const loadPack = async (packId: string = 'te-10-maths-ap') => {
    try {
      const res = await fetch(`/packs/${packId}.json`);
      if (res.ok) {
        const data: ContentPack = await res.json();
        setPack(data);
      }
    } catch (err) {
      console.warn('Failed to fetch pack:', err);
    }
  };

  // Switch pack
  const switchPack = async (packId: string) => {
    await loadPack(packId);
  };

  // Seed default learners if first run
  const seedDefaultLearners = async () => {
    const existing = await localDb.getLearners();
    if (existing.length === 0) {
      const seeded: LearnerProfile[] = [
        {
          id: 'learner_cheetah',
          nickname: 'చిరుత',
          animal: 'cheetah',
          avatarColor: '#F59E0B',
          avatarEmoji: '🐆',
          packId: 'te-10-maths-ap',
          createdAt: Date.now() - 3600 * 1000 * 24 * 3,
        },
        {
          id: 'learner_elephant',
          nickname: 'ఏనుగు',
          animal: 'elephant',
          avatarColor: '#3B82F6',
          avatarEmoji: '🐘',
          packId: 'te-10-maths-ap',
          createdAt: Date.now() - 3600 * 1000 * 24 * 2,
        },
        {
          id: 'learner_deer',
          nickname: 'జింక',
          animal: 'deer',
          avatarColor: '#10B981',
          avatarEmoji: '🦌',
          packId: 'te-10-maths-ap',
          createdAt: Date.now() - 3600 * 1000 * 24 * 1,
        },
      ];

      for (const l of seeded) {
        await localDb.saveLearner(l);
      }
      setLearners(seeded);
    } else {
      setLearners(existing);
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
    loadPack('te-10-maths-ap');
    seedDefaultLearners();

    // Load persisted settings
    localDb.getSetting<boolean>('lowDataMode', false).then(setLowDataMode);
    localDb.getSetting<'normal' | 'large' | 'xlarge'>('fontSize', 'normal').then(setFontSizeState);
    localDb.getSetting<number>('dataUsedKb', 34).then(setDataUsedKb);

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

  // Shared-phone 2-minute auto-lock
  const resetInactivityTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }

    // Only auto-lock if currently on a learner screen (not S1 picker, S10 guardian, S11 impact)
    if (activeLearner && currentScreen !== 'S1_PICKER' && currentScreen !== 'S10_GUARDIAN' && currentScreen !== 'S11_IMPACT' && currentScreen !== 'S12_PACK_EDITOR') {
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
    setCurrentScreen('S3_HOME');
  };

  const createLearner = async (learner: LearnerProfile) => {
    await localDb.saveLearner(learner);
    const updated = await localDb.getLearners();
    setLearners(updated);
    selectLearner(learner);
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
        isOffline,
        lowDataMode,
        fontSize,
        dataUsedKb,
        syncTick,
        queuedDoubtsCount,
        setScreen: setCurrentScreen,
        selectTopic: setSelectedTopicId,
        selectLearner,
        createLearner,
        switchLearner,
        toggleLowDataMode,
        setFontSize,
        incrementDataUsage,
        clearAiCache,
        refreshLearnerData,
        triggerSync,
        switchPack,
      }}
    >
      <div
        className={`w-full min-h-screen ${
          fontSize === 'large' ? 'text-[20px]' : fontSize === 'xlarge' ? 'text-[22px]' : 'text-[18px]'
        }`}
      >
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
