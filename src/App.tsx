import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { S1_ProfilePicker } from './screens/S1_ProfilePicker';
import { S2_CreateProfile } from './screens/S2_CreateProfile';
import { S3_HomeScreen } from './screens/S3_HomeScreen';
import { S4_LessonScreen } from './screens/S4_LessonScreen';
import { S5_PracticeScreen } from './screens/S5_PracticeScreen';
import { S7_AskDoubtScreen } from './screens/S7_AskDoubtScreen';
import { S8_ProgressScreen } from './screens/S8_ProgressScreen';
import { S9_SettingsScreen } from './screens/S9_SettingsScreen';
import { S10_GuardianScreen } from './screens/S10_GuardianScreen';
import { S11_ImpactScreen } from './screens/S11_ImpactScreen';
import { S12_PackEditorScreen } from './screens/S12_PackEditorScreen';

export const AppContent: React.FC = () => {
  const { currentScreen, setScreen, activeLearner } = useApp();

  // Support direct route hashes: #guardian, #impact, #admin, #practice
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('guardian') || path.includes('guardian')) {
      setScreen('S10_GUARDIAN');
    } else if (hash.includes('impact') || path.includes('impact')) {
      setScreen('S11_IMPACT');
    } else if (hash.includes('admin') || path.includes('admin')) {
      setScreen('S12_PACK_EDITOR');
    }
  }, [setScreen]);

  // Route screen rendering
  switch (currentScreen) {
    case 'S1_PICKER':
      return <S1_ProfilePicker />;
    case 'S2_CREATE':
      return <S2_CreateProfile />;
    case 'S3_HOME':
      return activeLearner ? <S3_HomeScreen /> : <S1_ProfilePicker />;
    case 'S4_LESSON':
      return <S4_LessonScreen />;
    case 'S5_PRACTICE':
      return <S5_PracticeScreen />;
    case 'S7_DOUBT':
      return <S7_AskDoubtScreen />;
    case 'S8_PROGRESS':
      return <S8_ProgressScreen />;
    case 'S9_SETTINGS':
      return <S9_SettingsScreen />;
    case 'S10_GUARDIAN':
      return <S10_GuardianScreen />;
    case 'S11_IMPACT':
      return <S11_ImpactScreen />;
    case 'S12_PACK_EDITOR':
      return <S12_PackEditorScreen />;
    default:
      return <S1_ProfilePicker />;
  }
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
