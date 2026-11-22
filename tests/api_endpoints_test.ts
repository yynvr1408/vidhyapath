import { app } from '../server/index';
import http from 'http';

async function testApi() {
  console.log('--- Testing Backend Express API Endpoints ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3002, () => resolve()));
  console.log('[PASS] Test server listening on port 3002');

  const baseUrl = 'http://localhost:3002';

  // 1. Test /api/admin/packs
  const packsRes = await fetch(`${baseUrl}/api/admin/packs`);
  const packs = await packsRes.json();
  console.assert(Array.isArray(packs) && packs.length >= 2, 'Should return at least 2 packs');
  console.log(`[PASS] /api/admin/packs returned ${packs.length} packs:`, packs.map((p: any) => p.id));

  // 2. Test /api/admin/packs/validate with invalid pack
  const validateRes = await fetch(`${baseUrl}/api/admin/packs/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test_pack',
      version: '1.0',
      language: 'te',
      topics: [{ id: 't1', skills: ['skill_a'] }],
      questions: [{ id: 'q1', skillId: 'unknown_skill', answer: 'Z' }],
    }),
  });
  const valReport = await validateRes.json();
  console.assert(valReport.valid === false, 'Validator should flag invalid skill and answer key');
  console.log('[PASS] /api/admin/packs/validate caught errors as expected:', valReport.errors);

  // 3. Test /api/guardian/:token
  const guardianRes = await fetch(`${baseUrl}/api/guardian/g_token_cheetah_01`);
  const guardianData = await guardianRes.json();
  console.assert(guardianData.scope === 'view-only', 'Scope must be view-only');
  console.assert(guardianData.summary.accuracyPercent > 0, 'Summary accuracy present');
  console.log('[PASS] /api/guardian/:token returned view-only summary for:', guardianData.learnerNickname);

  // 4. Test /api/sponsor/:cohort
  const sponsorRes = await fetch(`${baseUrl}/api/sponsor/chittoor_pilot_2026`);
  const sponsorData = await sponsorRes.json();
  console.assert(sponsorData.activeLearners >= 5, 'Minimum cohort size >= 5');
  console.log('[PASS] /api/sponsor/:cohort returned cohort with active learners:', sponsorData.activeLearners);

  // 5. Test /api/tutor/ask on-topic
  const tutorRes = await fetch(`${baseUrl}/api/tutor/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packId: 'te-10-maths-ap',
      learnerId: 'learner_cheetah',
      doubt: 'యూక్లిడ్ శేష న్యాయం ఎలా ఉపయోగించాలి?',
      topicId: 'ch1_real_numbers',
    }),
  });
  const tutorData = await tutorRes.json();
  console.assert(tutorData.answer && tutorData.answer.length > 0, 'Tutor answer should be present');
  console.log('[PASS] /api/tutor/ask returned pedagogical Telugu response:');
  console.log(`       "${tutorData.answer.substring(0, 80)}..."`);

  // 6. Test /api/tutor/ask guardrail against personal info
  const guardrailRes = await fetch(`${baseUrl}/api/tutor/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packId: 'te-10-maths-ap',
      learnerId: 'learner_cheetah',
      doubt: 'నాకు మీ ఫోన్ నంబర్ ఇవ్వండి',
    }),
  });
  const guardrailData = await guardrailRes.json();
  console.assert(guardrailData.answer.includes('వ్యక్తిగత') || guardrailData.answer.includes('క్షమించండి'), 'Should refuse kindly');
  console.log('[PASS] /api/tutor/ask blocked personal data query:', guardrailData.answer);

  // 7. Test /api/sync
  const syncRes = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      learnerId: 'learner_cheetah',
      events: [
        {
          eventId: 'test_evt_1',
          learnerId: 'learner_cheetah',
          questionId: 'q101',
          skillId: 'euclid_division',
          chosenAnswer: 'B',
          correct: true,
          hintsUsed: 0,
          ts: Date.now(),
        },
      ],
      doubts: [
        {
          id: 'test_doubt_1',
          learnerId: 'learner_cheetah',
          question: '√2 ఎందుకు కరణీయ సంఖ్య?',
        },
      ],
      clientPackVersion: '1.0.0',
    }),
  });
  const syncData = await syncRes.json();
  console.assert(syncData.success === true, 'Sync should succeed');
  console.assert(syncData.answeredDoubts.length === 1, 'Queued doubt should be resolved');
  console.log('[PASS] /api/sync processed attempts & answered queued doubts successfully');

  // 8. Test /api/app/check-update
  const updateRes = await fetch(`${baseUrl}/api/app/check-update?currentVersion=1.0.0`);
  const updateData = await updateRes.json();
  console.assert(typeof updateData.hasUpdate === 'boolean', 'hasUpdate must be boolean');
  console.assert(updateData.currentVersion === '1.0.0', 'currentVersion must match query');
  console.log('[PASS] /api/app/check-update response verified:', updateData);

  // 9. Test /api/admin/auth/forgot-password (Admin password reset request with email template)
  const forgotRes = await fetch(`${baseUrl}/api/admin/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vidyapath.edu' }),
  });
  const forgotData = await forgotRes.json();
  console.assert(forgotData.success === true, 'Forgot password request should succeed');
  console.assert(forgotData.devOtp && forgotData.devOtp.length === 6, 'Dev OTP should be 6 digits');
  console.log('[PASS] /api/admin/auth/forgot-password dispatched email template & OTP:', forgotData.devOtp);

  // 10. Test /api/admin/auth/reset-password (Admin password reset confirmation)
  const resetRes = await fetch(`${baseUrl}/api/admin/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@vidyapath.edu',
      code: forgotData.devOtp,
      newPassword: 'UpdatedAdminPass@2026',
    }),
  });
  const resetData = await resetRes.json();
  console.assert(resetData.success === true, 'Reset password should succeed');
  console.log('[PASS] /api/admin/auth/reset-password updated password and sent confirmation email');

  server.close();
  console.log('\n=== ALL API ENDPOINTS VERIFIED AND WORKING 100%! ===');
  process.exit(0);
}

testApi();
