// React Hook to bind native phone back button & mobile navigation with App state
import { useEffect, useState } from 'react';
import { navigationManager, BackHandler } from '../services/navigationManager';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

export function useNativeBackButton() {
  const { currentScreen, setScreen, activeLearner, switchLearner, currentLanguage } = useApp();
  const [exitToast, setExitToast] = useState<string | null>(null);

  const t = getTranslations(currentLanguage);

  useEffect(() => {
    // 1. Subscribe to exit toast notifications
    const unsubscribeToast = navigationManager.onExitToast((msg) => {
      setExitToast(msg);
    });

    // 2. Set default back behavior when no modal/drawer is open
    navigationManager.setDefaultBackAction(() => {
      // If in deep screen (e.g. LESSON_DETAIL, AI_TUTOR, PRACTICE, PROGRESS, PARENT_VIEW, ADMIN)
      if (
        currentScreen !== 'MY_SYLLABUS' &&
        currentScreen !== 'S1_PICKER' &&
        currentScreen !== 'S3_HOME'
      ) {
        setScreen('MY_SYLLABUS');
        return true;
      }

      // If on MY_SYLLABUS and learner is active, pressing back switches profile / logs out
      if (currentScreen === 'MY_SYLLABUS' && activeLearner) {
        switchLearner();
        return true;
      }

      // At S1_PICKER root
      return false;
    });

    // 3. Initialize hardware listener with localized message
    const cleanupInit = navigationManager.init(() => t.pressBackAgainToExit);

    return () => {
      unsubscribeToast();
      cleanupInit();
    };
  }, [currentScreen, activeLearner, setScreen, switchLearner, t.pressBackAgainToExit]);

  return {
    exitToast,
    triggerBack: () => navigationManager.triggerBack(t.pressBackAgainToExit),
    registerModalBackHandler: (handler: BackHandler, priority: number = 100) => {
      return navigationManager.registerBackHandler(handler, priority);
    },
  };
}
