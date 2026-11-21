// Test 7: privacy guardrail. Profile creation must not store or send personal identifiers.
// Real: AddProfileModal -> AppProvider.createLearner -> localDb (fake-indexeddb), and every fetch body.
// Written as .ts (no JSX), so the React tree is built with createElement.
import React, { createElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProfileModal } from '../../src/components/AddProfileModal';
import { localDb } from '../../src/db/indexedDb';
import { getTranslations } from '../../src/utils/translations';
import { AppTestRoot, dumpAllStores, installFetchMock, resetAppState } from '../helpers/harness';
import { findKeysNamed } from '../helpers/keys';

const FORBIDDEN = ['email', 'phone', 'address', 'dob', 'mobile', 'aadhaar'];
const en = getTranslations('en');

describe('privacy guardrail on profile creation', () => {
  it('no IndexedDB record and no API request body carries personal identifiers; avatarPhoto absent', async () => {
    await resetAppState();
    const fetchSpy = installFetchMock();
    const user = userEvent.setup();

    render(
      createElement(
        AppTestRoot,
        null,
        createElement(AddProfileModal, { isOpen: true, onClose: vi.fn() })
      )
    );

    await user.type(screen.getByPlaceholderText('e.g. Ravi / రవి'), 'Priya');
    await user.click(screen.getByRole('button', { name: en.save }));

    await waitFor(async () => {
      const learners = await localDb.getLearners();
      expect(learners.some((l) => l.nickname === 'Priya')).toBe(true);
    });

    // 1. Every record in every IndexedDB store.
    const stores = await dumpAllStores();
    const leaks: string[] = [];
    for (const [store, records] of Object.entries(stores)) {
      leaks.push(...findKeysNamed(records, FORBIDDEN, store));
    }
    expect(leaks).toEqual([]);

    // 2. The created profile has no avatarPhoto key.
    const priya = (await localDb.getLearners()).find((l) => l.nickname === 'Priya')!;
    expect('avatarPhoto' in priya).toBe(false);

    // 3. Every request body sent during profile creation.
    const bodies = fetchSpy.mock.calls
      .map(([, init]) => init?.body)
      .filter((b): b is string => typeof b === 'string')
      .map((b) => JSON.parse(b));
    for (const body of bodies) {
      expect(findKeysNamed(body, FORBIDDEN)).toEqual([]);
    }
  });
});
