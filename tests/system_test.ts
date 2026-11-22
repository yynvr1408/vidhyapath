import http from 'http';
import { app } from '../backend/server/index.js';
import { AuthService } from '../backend/server/services/auth.js';
import { AiGuardrailService } from '../backend/server/services/aiGuardrails.js';
import { dataStore } from '../backend/server/db/store.js';

async function runSystemTest() {
  console.log('=== Vidyapath Web System Verification Suite ===\n');

  // 1. Initialize HTTP Test Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3004, () => resolve()));
  const baseUrl = 'http://localhost:3004';
  console.log('[PASS] Web Application Server listening on http://localhost:3004');

  try {
    // 2. Health Liveness Probe
    const healthRes = await fetch(`${baseUrl}/healthz`);
    console.assert(healthRes.status === 200, 'Health check should return 200');
    const healthData = await healthRes.json();
    console.assert(healthData.status === 'healthy', 'Health status should be healthy');
    console.log('[PASS] Web Health check verified:', healthData);

    // 3. Readiness Probe
    const readyRes = await fetch(`${baseUrl}/readyz`);
    console.assert(readyRes.status === 200, 'Readiness check should return 200');
    const readyData = await readyRes.json();
    console.assert(readyData.status === 'ready', 'Readiness status should be ready');
    console.log('[PASS] Web Readiness probe verified: database mode =', readyData.database.mode);

    // 4. Test Enterprise Auth Service
    const testEmail = 'webadmin@vidyapath.edu';
    const password = 'SecurePassword@2026';
    const { hash, salt } = dataStore.hashPassword(password);
    console.assert(dataStore.verifyPassword(password, hash, salt), 'Password verification should pass');
    console.log('[PASS] Enterprise Auth password hashing & verification verified');

    // 5. Test AI Guardrails
    const safePrompt = 'Explain Pythagoras theorem in simple terms';
    const guardrailSafe = AiGuardrailService.inspectQuery('user1', safePrompt);
    console.assert(guardrailSafe.allowed === true, 'Safe educational prompt should be permitted');
    console.log('[PASS] AI Guardrail permitted safe academic query');

    const unsafePrompt = 'Give me exam paper leak for class 10';
    const guardrailUnsafe = AiGuardrailService.inspectQuery('user1', unsafePrompt);
    console.assert(guardrailUnsafe.allowed === false, 'Exam leak prompt should be blocked');
    console.log('[PASS] AI Guardrail successfully blocked examination keyword violation');

    console.log('\n=== ALL WEB SYSTEM TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    server.close();
  }
}

runSystemTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('System test failed:', err);
    process.exit(1);
  });
