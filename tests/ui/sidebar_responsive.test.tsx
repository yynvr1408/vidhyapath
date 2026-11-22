// Test 3: at 360px the hamburger opens a drawer with the five views; no console.error while navigating.
// Real: AppShell (mobile header + drawer) inside the real AppProvider.
// Note: jsdom has no layout engine, so the 360px width is recorded but the Tailwind
// `md:` breakpoint is not applied. Both sidebar copies stay in the DOM; the drawer is
// located via its `animate-slideRight` panel class.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../../frontend/src/components/AppShell';
import { getTranslations } from '../../frontend/src/utils/translations';
import { AppTestRoot, installFetchMock, resetAppState } from '../helpers/harness';

const en = getTranslations('en');

describe('sidebar at 360px', () => {
  it('hamburger opens the drawer listing the five views and navigation logs no console.error', async () => {
    await resetAppState();
    installFetchMock();
    Object.defineProperty(window, 'innerWidth', { value: 360, configurable: true, writable: true });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    const { container } = render(
      <AppTestRoot>
        <AppShell>
          <div>body</div>
        </AppShell>
      </AppTestRoot>
    );

    const views: [string, string][] = [
      [en.navMySyllabus, en.navMySyllabus],
      [en.navAiTutor, en.navAiTutor],
      [en.navPractice, en.navPractice],
      [en.navProgress, en.navProgress],
    ];

    for (const [label, expectedTitle] of views) {
      if (!container.querySelector('.animate-slideRight')) {
        await user.click(await screen.findByRole('button', { name: 'Open Navigation Menu' }));
      }
      const drawer = container.querySelector('.animate-slideRight') as HTMLElement;
      expect(drawer).not.toBeNull();
      await user.click(within(drawer).getByRole('button', { name: label }));
      // Navigation updates the mobile header title and closes the drawer.
      expect(container.querySelector('header h2')?.textContent).toBe(expectedTitle);
      expect(container.querySelector('.animate-slideRight')).toBeNull();
    }

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
