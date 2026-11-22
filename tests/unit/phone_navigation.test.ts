// Tests for Phone Navigation Controls, Hardware Back-Button & Mobile Touch Tabs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { navigationManager } from '../../src/services/navigationManager';
import { getTranslations } from '../../src/utils/translations';

describe('Phone Navigation Controls Suite', () => {
  beforeEach(() => {
    // Clear any existing registered handlers
    // @ts-expect-error accessing private for test reset
    navigationManager.handlers = [];
    // @ts-expect-error accessing private for test reset
    navigationManager.lastBackPressTime = 0;
    navigationManager.setDefaultBackAction(null);
  });

  it('executes modal back handler with higher priority before lower priority handlers', async () => {
    const executionOrder: string[] = [];

    const unregisterLow = navigationManager.registerBackHandler(() => {
      executionOrder.push('low_priority');
      return true;
    }, 10);

    const unregisterHigh = navigationManager.registerBackHandler(() => {
      executionOrder.push('high_priority');
      return true;
    }, 100);

    const handled = await navigationManager.triggerBack();
    expect(handled).toBe(true);
    expect(executionOrder).toEqual(['high_priority']);

    unregisterHigh();
    unregisterLow();
  });

  it('delegates to next handler when higher priority handler returns false', async () => {
    const executionOrder: string[] = [];

    const unregisterModal = navigationManager.registerBackHandler(() => {
      executionOrder.push('modal_not_open');
      return false; // not handled
    }, 100);

    const unregisterDrawer = navigationManager.registerBackHandler(() => {
      executionOrder.push('drawer_handled');
      return true;
    }, 50);

    const handled = await navigationManager.triggerBack();
    expect(handled).toBe(true);
    expect(executionOrder).toEqual(['modal_not_open', 'drawer_handled']);

    unregisterModal();
    unregisterDrawer();
  });

  it('triggers default back action when no modal handler consumes the event', async () => {
    let defaultActionCalled = false;
    navigationManager.setDefaultBackAction(() => {
      defaultActionCalled = true;
      return true;
    });

    const handled = await navigationManager.triggerBack();
    expect(handled).toBe(true);
    expect(defaultActionCalled).toBe(true);
  });

  it('handles double-tap at root screen with exit toast on first tap', async () => {
    const toastMessages: (string | null)[] = [];
    const unsubscribe = navigationManager.onExitToast((msg) => {
      toastMessages.push(msg);
    });

    // 1st back tap at root
    const handledFirst = await navigationManager.triggerBack('Press back again to exit');
    expect(handledFirst).toBe(false);
    expect(toastMessages).toContain('Press back again to exit');

    // 2nd back tap at root within 2000ms
    const handledSecond = await navigationManager.triggerBack('Press back again to exit');
    expect(handledSecond).toBe(true);

    unsubscribe();
  });

  it('strictly validates trilingual exit message and bottom nav keys across te, hi, en', () => {
    const te = getTranslations('te');
    const hi = getTranslations('hi');
    const en = getTranslations('en');

    // Exit messages
    expect(te.pressBackAgainToExit).toBe('యాప్ నుండి నిష్క్రమించడానికి మళ్లీ వెనక్కి నొక్కండి');
    expect(hi.pressBackAgainToExit).toBe('ऐप से बाहर निकलने के लिए फिर से बैक दबाएं');
    expect(en.pressBackAgainToExit).toBe('Press back again to exit the app');

    // Bottom nav keys
    expect(te.bottomNavSyllabus).toBe('సిలబస్');
    expect(hi.bottomNavSyllabus).toBe('पाठ्यक्रम');
    expect(en.bottomNavSyllabus).toBe('Syllabus');

    expect(te.bottomNavTutor).toBe('AI ట్యూటర్');
    expect(hi.bottomNavTutor).toBe('AI ट्यूटर');
    expect(en.bottomNavTutor).toBe('AI Tutor');

    expect(te.bottomNavPractice).toBe('సాధన');
    expect(hi.bottomNavPractice).toBe('अभ्यास');
    expect(en.bottomNavPractice).toBe('Practice');

    expect(te.bottomNavProgress).toBe('ప్రగతి');
    expect(hi.bottomNavProgress).toBe('प्रगति');
    expect(en.bottomNavProgress).toBe('Progress');

    expect(te.bottomNavParent).toBe('తల్లిదండ్రులు');
    expect(hi.bottomNavParent).toBe('अभिभावक');
    expect(en.bottomNavParent).toBe('Parent');
  });
});
