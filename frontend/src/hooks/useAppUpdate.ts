// React hook for observing app update state
import { useState, useEffect } from 'react';
import { updateManager, UpdateInfo } from '../services/updateManager';

export function useAppUpdate() {
  const [state, setState] = useState(() => updateManager.getState());

  useEffect(() => {
    // Initial check on mount if not checked yet
    if (!state.updateInfo && !state.isChecking) {
      updateManager.checkForUpdates(false).catch(() => {});
    }

    const unsubscribe = updateManager.subscribe(() => {
      setState(updateManager.getState());
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    checkForUpdates: () => updateManager.checkForUpdates(true),
    openModal: () => updateManager.openModal(),
    closeModal: () => updateManager.closeModal(),
    dismissBanner: () => updateManager.dismissBanner(),
    applyPwaUpdate: () => updateManager.applyPwaUpdate(),
  };
}
