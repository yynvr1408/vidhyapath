// Test 2: learner PIN validation. Real: PinPadModal + AppProvider (for translated strings).
// Note: PinPadModal.handleDigit accepts '1234' for every learner (`next === '1234'`);
// the '1234 does not unlock' assertion is expected to FAIL until that is fixed.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinPadModal } from '../../frontend/src/components/PinPadModal';
import { getTranslations } from '../../frontend/src/utils/translations';
import { AppTestRoot, makeLearner, resetAppState } from '../helpers/harness';

const en = getTranslations('en');

function renderModal(onSuccess: () => void) {
  const learner = makeLearner({ id: 'learner_c', nickname: 'Chandu', loginCode: 'CHAN-10', pin: '5678' });
  return render(
    <AppTestRoot>
      <PinPadModal learner={learner} isOpen onClose={vi.fn()} onSuccess={onSuccess} />
    </AppTestRoot>
  );
}

describe('learner PIN validation', () => {
  it('a wrong PIN shows a translated error and does not unlock', async () => {
    await resetAppState();
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderModal(onSuccess);

    for (const d of '9999') await user.click(screen.getByRole('button', { name: d }));

    // The error is the translated string, not the raw translation key.
    expect(await screen.findByText(en.incorrectPin)).toBeInTheDocument();
    expect(screen.queryByText('incorrectPin')).toBeNull();
    await new Promise((r) => setTimeout(r, 300));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("'1234' does NOT unlock a learner whose PIN is not 1234", async () => {
    await resetAppState();
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderModal(onSuccess);

    for (const d of '1234') await user.click(screen.getByRole('button', { name: d }));

    expect(await screen.findByText(en.incorrectPin)).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('the learner own PIN unlocks (control case)', async () => {
    await resetAppState();
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderModal(onSuccess);

    for (const d of '5678') await user.click(screen.getByRole('button', { name: d }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
