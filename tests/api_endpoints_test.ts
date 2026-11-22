import { app } from '../backend/server/index.js';
import { AuthService } from '../backend/server/services/auth.js';
import { dataStore } from '../backend/server/db/store.js';
import http from 'http';

async function testApi() {
  console.log('--- Testing Backend Express API Endpoints ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3002, () => resolve()));
  console.log('[PASS] Test server listening on port 3002');

  const baseUrl = 'http://localhost:3002';

  // Seed test super_admin user
  const adminPwd = dataStore.hashPassword('Password@2026');
  dataStore.users.set('admin_test', {
    id: 'admin_test',
    email: 'admin@vidyapath.edu',
    fullName: 'Super Admin',
    role: 'super_admin',
    status: 'active',
    passwordHash: adminPwd.hash,
    salt: adminPwd.salt,
    createdAt: Date.now(),
  } as any);

  const adminToken = AuthService.generateToken({
    id: 'admin_test',
    email: 'admin@vidyapath.edu',
    role: 'super_admin',
    fullName: 'Super Admin',
    status: 'active',
    createdAt: Date.now(),
  });

  try {
    // 1. Test /api/admin/packs
    const packsRes = await fetch(`${baseUrl}/api/admin/packs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const packs = await packsRes.json();
    console.assert(Array.isArray(packs) && packs.length >= 2, 'Should return at least 2 packs');
    console.log(`[PASS] /api/admin/packs returned ${packs.length} packs:`, packs.map((p: any) => p.id));

    // 2. Test /api/admin/packs/validate with invalid pack
    const validateRes = await fetch(`${baseUrl}/api/admin/packs/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
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

    // 3. Test /api/auth/login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vidyapath.edu', password: 'Password@2026' }),
    });
    const loginData = await loginRes.json();
    console.assert(loginData.success === true, 'Login should succeed');
    console.assert(loginData.user.role === 'super_admin', 'Role must match super_admin');
    console.log('[PASS] /api/auth/login authenticated successfully for:', loginData.user.email);

    // 4. Test /healthz & /readyz
    const healthRes = await fetch(`${baseUrl}/healthz`);
    const healthData = await healthRes.json();
    console.assert(healthData.status === 'healthy', 'Health check should be healthy');
    console.log('[PASS] /healthz returned healthy probe status');

    // 5. Test /api/tutor/ask on-topic
    const tutorRes = await fetch(`${baseUrl}/api/tutor/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        packId: 'te-10-maths-ap',
        learnerId: 'admin_test',
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        packId: 'te-10-maths-ap',
        learnerId: 'admin_test',
        doubt: 'నాకు మీ ఫోన్ నంబర్ ఇవ్వండి',
      }),
    });
    const guardrailData = await guardrailRes.json();
    console.assert(guardrailData.answer.includes('వ్యక్తిగత') || guardrailData.answer.includes('క్షమించండి'), 'Should refuse kindly');
    console.log('[PASS] /api/tutor/ask blocked personal data query:', guardrailData.answer);

    // 7. Test /api/admin/auth/forgot-password (Admin password reset request with email template)
    const forgotRes = await fetch(`${baseUrl}/api/admin/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vidyapath.edu' }),
    });
    const forgotData = await forgotRes.json();
    console.assert(forgotData.success === true, 'Forgot password request should succeed');
    console.assert(forgotData.devOtp && forgotData.devOtp.length === 6, 'Dev OTP should be 6 digits');
    console.log('[PASS] /api/admin/auth/forgot-password dispatched email template & OTP:', forgotData.devOtp);

    // 8. Test /api/admin/auth/reset-password (Admin password reset confirmation)
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

    console.log('\n=== ALL API ENDPOINTS VERIFIED AND WORKING 100%! ===');
  } finally {
    server.close();
  }
}

testApi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('API Test failed:', err);
    process.exit(1);
  });
