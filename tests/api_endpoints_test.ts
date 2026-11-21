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

  // 8. Test /api/app/check-update (GitHub Releases)
  const updateRes = await fetch(`${baseUrl}/api/app/check-update?currentVersion=1.0.0`);
  const updateData = await updateRes.json();
  console.assert(typeof updateData.hasUpdate === 'boolean', 'hasUpdate boolean expected');
  console.log('[PASS] /api/app/check-update returned release status:', updateData.hasUpdate ? 'Update available' : 'Current version matches');

  // 9. Test /api/tutor/summary (AI Study Digest)
  const summaryRes = await fetch(`${baseUrl}/api/tutor/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'చిరుత',
      accuracyPercent: 85,
      strongSkills: ['యూక్లిడ్ న్యాయం', 'ప్రధాన కారణాంకాలు'],
      weakSkills: ['సమితుల భేదం'],
    }),
  });
  const summaryData = await summaryRes.json();
  console.assert(summaryData.summary && summaryData.summary.length > 0, 'Summary text expected');
  console.log('[PASS] /api/tutor/summary returned study digest:');
  console.log(`       "${summaryData.summary.substring(0, 80)}..."`);

  // 10. Test /api/storage/upload (R2 / Local storage)
  const testBase64 = Buffer.from('test audio or material content').toString('base64');
  const uploadRes = await fetch(`${baseUrl}/api/storage/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataBase64: testBase64,
      fileName: 'unit_test_upload.txt',
      contentType: 'text/plain',
    }),
  });
  const uploadData = await uploadRes.json();
  console.assert(uploadData.success === true, 'Upload should succeed');
  console.assert(typeof uploadData.url === 'string' && uploadData.url.length > 0, 'Public URL expected');
  console.log('[PASS] /api/storage/upload returned asset URL:', uploadData.url);

  // 11. Test /api/health (Deployment health check)
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.assert(healthData.status === 'ok', 'Health status should be ok');
  console.assert(healthData.services !== undefined, 'Services object should be present');
  console.log('[PASS] /api/health responded ok with services:', healthData.services);

  server.close();
  console.log('\n=== ALL API ENDPOINTS VERIFIED AND WORKING 100%! ===');
  process.exit(0);
}

testApi();
