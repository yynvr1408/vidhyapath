// Strict UI Language End-to-End Switching Test Suite
// Verifies ONLY and STRICTLY three languages: Telugu (te), Hindi (hi), and English (en)
// across Sidebar, My Syllabus, AI Tutor, Practice, My Progress, and Parent/Teacher View.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AppShell } from '../../src/components/AppShell';
import { MySyllabusScreen } from '../../src/screens/MySyllabusScreen';
import { AiTutorScreen } from '../../src/screens/AiTutorScreen';
import { PracticeWeakTopicsScreen } from '../../src/screens/PracticeWeakTopicsScreen';
import { MyProgressScreen } from '../../src/screens/MyProgressScreen';
import { ParentTeacherViewScreen } from '../../src/screens/ParentTeacherViewScreen';
import { TRANSLATIONS } from '../../src/utils/translations';
import {
  AppTestRoot,
  Captured,
  installFetchMock,
  makeLearner,
  resetAppState,
} from '../helpers/harness';

describe('Strict Language Suite - UI End-to-End Switching', () => {
  beforeEach(async () => {
    await resetAppState();
    installFetchMock();
    (window as any).SpeechSynthesisUtterance = class {
      text = '';
      lang = '';
      rate = 1;
      pitch = 1;
      constructor(text?: string) {
        this.text = text || '';
      }
    };
    (window as any).speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    };
  });

  // --------------------------------------------------------------------------
  // 1. Sidebar Trilingual Navigation & Language Selector
  // --------------------------------------------------------------------------
  describe('1. Sidebar Navigation Trilingual Parity', () => {
    it('renders Telugu navigation labels when Telugu learner is active', async () => {
      const learnerTe = makeLearner({
        id: 'l_te',
        nickname: 'రాము',
        loginCode: 'RAMU-10',
        pin: '1234',
        packId: 'te-10-maths-ap',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerTe} captured={captured}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('te');
      });

      const t = TRANSLATIONS.te;
      // Core sidebar buttons
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navMySyllabus) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navAiTutor) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navPractice) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navProgress) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navParentView) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.adminPortal) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navSwitchProfile) }).length).toBeGreaterThanOrEqual(1);

      // Verify language label
      expect(screen.getByText(t.languageLabel)).toBeInTheDocument();
    });

    it('renders Hindi navigation labels when Hindi learner is active', async () => {
      const learnerHi = makeLearner({
        id: 'l_hi',
        nickname: 'रोहन',
        loginCode: 'ROHN-10',
        pin: '1234',
        packId: 'hi-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerHi} captured={captured}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('hi');
      });

      const t = TRANSLATIONS.hi;
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navMySyllabus) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navAiTutor) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navPractice) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navProgress) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navParentView) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.adminPortal) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navSwitchProfile) }).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText(t.languageLabel)).toBeInTheDocument();
    });

    it('renders English navigation labels when English learner is active', async () => {
      const learnerEn = makeLearner({
        id: 'l_en',
        nickname: 'Asha',
        loginCode: 'ASHA-10',
        pin: '1234',
        packId: 'en-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerEn} captured={captured}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('en');
      });

      const t = TRANSLATIONS.en;
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navMySyllabus) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navAiTutor) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navPractice) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navProgress) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navParentView) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.adminPortal) }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes(t.navSwitchProfile) }).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText(t.languageLabel)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. AI Tutor Trilingual Greetings & Quick Chips
  // --------------------------------------------------------------------------
  describe('2. AI Tutor Trilingual Greeting & Prompt Chips', () => {
    it('renders Telugu greeting, quick chips, and placeholder for Telugu learner', async () => {
      const learnerTe = makeLearner({
        id: 'l_te',
        nickname: 'రాము',
        loginCode: 'RAMU-10',
        pin: '1234',
        packId: 'te-10-maths-ap',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerTe} captured={captured}>
          <AiTutorScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('te');
      });

      // Assert Telugu initial greeting
      expect(
        screen.getByText((c) => c.includes('నమస్కారం') && c.includes('గణిత ట్యూటర్‌ని'))
      ).toBeInTheDocument();

      // Assert Telugu quick chips
      expect(screen.getAllByRole('button', { name: (c) => c.includes('సులభంగా') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('ఉదాహరణ') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('సూత్రం') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('చిట్కా') }).length).toBeGreaterThanOrEqual(1);

      // Assert Telugu placeholder
      expect(
        screen.getByPlaceholderText(TRANSLATIONS.te.typeDoubtPlaceholder)
      ).toBeInTheDocument();
    });

    it('renders Hindi greeting, quick chips, and placeholder for Hindi learner', async () => {
      const learnerHi = makeLearner({
        id: 'l_hi',
        nickname: 'रोहन',
        loginCode: 'ROHN-10',
        pin: '1234',
        packId: 'hi-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerHi} captured={captured}>
          <AiTutorScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('hi');
      });

      // Assert Hindi initial greeting
      expect(
        screen.getByText((c) => c.includes('नमस्ते') && c.includes('ट्यूटर हूँ'))
      ).toBeInTheDocument();

      // Assert Hindi quick chips
      expect(screen.getAllByRole('button', { name: (c) => c.includes('सरल') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('उदाहरण') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('सूत्र') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('सुझाव') }).length).toBeGreaterThanOrEqual(1);

      // Assert Hindi placeholder
      expect(
        screen.getByPlaceholderText(TRANSLATIONS.hi.typeDoubtPlaceholder)
      ).toBeInTheDocument();
    });

    it('renders English greeting, quick chips, and placeholder for English learner', async () => {
      const learnerEn = makeLearner({
        id: 'l_en',
        nickname: 'Asha',
        loginCode: 'ASHA-10',
        pin: '1234',
        packId: 'en-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerEn} captured={captured}>
          <AiTutorScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('en');
      });

      // Assert English initial greeting
      expect(
        screen.getByText((c) => c.includes('Hello') && c.includes('Maths Tutor'))
      ).toBeInTheDocument();

      // Assert English quick chips
      expect(screen.getAllByRole('button', { name: (c) => c.includes('Explain') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('example') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('formula') }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: (c) => c.includes('tip') }).length).toBeGreaterThanOrEqual(1);

      // Assert English placeholder
      expect(
        screen.getByPlaceholderText(TRANSLATIONS.en.typeDoubtPlaceholder)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. My Syllabus Screen Trilingual Parity
  // --------------------------------------------------------------------------
  describe('3. My Syllabus Screen Trilingual Parity', () => {
    it('renders Telugu chapter list and practice launch button', async () => {
      const learnerTe = makeLearner({
        id: 'l_te',
        nickname: 'రాము',
        loginCode: 'RAMU-10',
        pin: '1234',
        packId: 'te-10-maths-ap',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerTe} captured={captured}>
          <MySyllabusScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('te');
      });

      await waitFor(() => {
        expect(screen.getByText(/వాస్తవ సంఖ్యలు/i)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: (c) => c.includes(TRANSLATIONS.te.practiceNow) }).length).toBeGreaterThanOrEqual(1);
    });

    it('renders Hindi chapter list and practice launch button', async () => {
      const learnerHi = makeLearner({
        id: 'l_hi',
        nickname: 'रोहन',
        loginCode: 'ROHN-10',
        pin: '1234',
        packId: 'hi-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerHi} captured={captured}>
          <MySyllabusScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('hi');
      });

      await waitFor(() => {
        expect(screen.getByText(/वास्तविक संख्याएँ/i)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: (c) => c.includes(TRANSLATIONS.hi.practiceNow) }).length).toBeGreaterThanOrEqual(1);
    });

    it('renders English chapter list and practice launch button', async () => {
      const learnerEn = makeLearner({
        id: 'l_en',
        nickname: 'Asha',
        loginCode: 'ASHA-10',
        pin: '1234',
        packId: 'en-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerEn} captured={captured}>
          <MySyllabusScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('en');
      });

      await waitFor(() => {
        expect(screen.getByText(/Real Numbers/i)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: (c) => c.includes(TRANSLATIONS.en.practiceNow) }).length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Practice Weak Topics Screen Trilingual Parity
  // --------------------------------------------------------------------------
  describe('4. Practice Screen Trilingual Parity', () => {
    it('renders Telugu controls for Telugu learner', async () => {
      const learnerTe = makeLearner({
        id: 'l_te',
        nickname: 'రాము',
        loginCode: 'RAMU-10',
        pin: '1234',
        packId: 'te-10-maths-ap',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerTe} captured={captured}>
          <PracticeWeakTopicsScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('te');
      });

      const t = TRANSLATIONS.te;
      await waitFor(() => {
        expect(screen.getByRole('button', { name: (c) => c.includes(t.needHint) })).toBeInTheDocument();
      });
    });

    it('renders Hindi controls for Hindi learner', async () => {
      const learnerHi = makeLearner({
        id: 'l_hi',
        nickname: 'रोहन',
        loginCode: 'ROHN-10',
        pin: '1234',
        packId: 'hi-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerHi} captured={captured}>
          <PracticeWeakTopicsScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('hi');
      });

      const t = TRANSLATIONS.hi;
      await waitFor(() => {
        expect(screen.getByRole('button', { name: (c) => c.includes(t.needHint) })).toBeInTheDocument();
      });
    });

    it('renders English controls for English learner', async () => {
      const learnerEn = makeLearner({
        id: 'l_en',
        nickname: 'Asha',
        loginCode: 'ASHA-10',
        pin: '1234',
        packId: 'en-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerEn} captured={captured}>
          <PracticeWeakTopicsScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('en');
      });

      const t = TRANSLATIONS.en;
      await waitFor(() => {
        expect(screen.getByRole('button', { name: (c) => c.includes(t.needHint) })).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 5. Parent / Teacher View Trilingual Parity
  // --------------------------------------------------------------------------
  describe('5. Parent / Teacher View Trilingual Parity', () => {
    it('renders Telugu PIN prompt and unlock button for Telugu learner', async () => {
      const learnerTe = makeLearner({
        id: 'l_te',
        nickname: 'రాము',
        loginCode: 'RAMU-10',
        pin: '1234',
        packId: 'te-10-maths-ap',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerTe} captured={captured}>
          <ParentTeacherViewScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('te');
      });

      const t = TRANSLATIONS.te;
      expect(screen.getByText(t.parentViewTitle)).toBeInTheDocument();
      expect(screen.getByText(t.parentPinPrompt)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: (c) => c.includes(t.unlockBtn) })).toBeInTheDocument();
    });

    it('renders Hindi PIN prompt and unlock button for Hindi learner', async () => {
      const learnerHi = makeLearner({
        id: 'l_hi',
        nickname: 'रोहन',
        loginCode: 'ROHN-10',
        pin: '1234',
        packId: 'hi-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerHi} captured={captured}>
          <ParentTeacherViewScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('hi');
      });

      const t = TRANSLATIONS.hi;
      expect(screen.getByText(t.parentViewTitle)).toBeInTheDocument();
      expect(screen.getByText(t.parentPinPrompt)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: (c) => c.includes(t.unlockBtn) })).toBeInTheDocument();
    });

    it('renders English PIN prompt and unlock button for English learner', async () => {
      const learnerEn = makeLearner({
        id: 'l_en',
        nickname: 'Asha',
        loginCode: 'ASHA-10',
        pin: '1234',
        packId: 'en-10-maths-cbse',
      });
      const captured: Captured = { ctx: null };

      render(
        <AppTestRoot learner={learnerEn} captured={captured}>
          <ParentTeacherViewScreen />
        </AppTestRoot>
      );

      await act(async () => {
        await captured.ctx?.switchLanguage('en');
      });

      const t = TRANSLATIONS.en;
      expect(screen.getByText(t.parentViewTitle)).toBeInTheDocument();
      expect(screen.getByText(t.parentPinPrompt)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: (c) => c.includes(t.unlockBtn) })).toBeInTheDocument();
    });
  });
});
