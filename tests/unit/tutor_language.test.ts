// Unit: the tutor request must carry the learner's pack language, not a hardcoded 'te'.
// Real: TutorService.askDoubt / buildPrompt with a real pack from public/packs.
// The network boundary (fetch) is captured; the server is not called.
import { describe, it, expect } from 'vitest';
import { TutorService } from '../../frontend/src/services/tutor';
import { installFetchMock, loadPack, resetAppState } from '../helpers/harness';

describe('tutor language', () => {
  it('the /api/tutor/ask body sends the selected pack language code', async () => {
    await resetAppState();
    const pack = loadPack('hi-10-maths-cbse');
    const spy = installFetchMock();

    await TutorService.askDoubt(pack, 'learner_hi', 'qwerty unique doubt 9731', undefined, undefined, false, false, 'auto');

    const call = spy.mock.calls.find(([url]) => String(url).includes('/api/tutor/ask'));
    expect(call).toBeDefined();
    const body = JSON.parse(String(call![1]?.body));
    // Expected to FAIL today: the body has packId/learnerId/doubt/topicId/mistakeTag but no language.
    expect(body.language).toBe(pack.language);
    expect(body.language).not.toBe('te');
  });

  it('the prompt names the pack language and never hardcodes te for a Hindi pack', () => {
    const pack = loadPack('hi-10-maths-cbse');
    const prompt = TutorService.buildPrompt(pack, 'test doubt');
    expect(prompt).toContain(`(${pack.language})`);
    expect(prompt).not.toContain('(te)');
  });
});

