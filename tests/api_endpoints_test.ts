import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../backend/server/index.js';

async function testApi() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const packs = await fetch(`${baseUrl}/api/packs`);
    assert.equal(packs.status, 200);
    const packList = await packs.json();
    assert.ok(Array.isArray(packList) && packList.length > 0, 'published browser learning packs should be listed');

    for (const path of [
      '/api/admin/packs',
      '/api/super-admin/users',
      '/api/super-admin/stats',
      '/api/family/mine',
      '/api/academic/student-syllabus',
    ]) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, `${path} should require authentication`);
    }

    // Zero-auth public syllabus check
    const syllabusRes = await fetch(`${baseUrl}/api/syllabus`);
    assert.equal(syllabusRes.status, 200, 'GET /api/syllabus should return 200');
    const syllabusData = await syllabusRes.json();
    assert.ok(syllabusData.chapters && syllabusData.chapters.length > 0, 'Syllabus chapters should be returned');

    // Zero-auth student AI tutor access check
    const tutorRes = await fetch(`${baseUrl}/api/tutor/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doubt: 'Explain fractions.' }),
    });
    assert.equal(tutorRes.status, 200, '/api/tutor/ask should allow zero-auth student access');

    for (const [path, body] of [
      ['/api/sync', { learnerId: 'somebody-else', events: [] }],
      ['/api/upload', {}],
      ['/api/institution/inst_test/departments', { name: 'Computer Science', code: 'CSE' }],
      ['/api/institution/inst_test/programmes', { name: 'Computer Science', code: 'CSE', departmentId: 'dept_test', degreeType: 'B.Tech', totalSemesters: 8 }],
    ] as const) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 401, `${path} should require authentication`);
    }

    const validate = await fetch(`${baseUrl}/api/admin/packs/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'attempt', topics: [], questions: [] }),
    });
    assert.equal(validate.status, 401, 'pack validation should require a super-admin token');

    for (const path of ['/api/app/check-update?currentVersion=1.0.0', '/api/guardian/demo-token', '/api/sponsor/demo-cohort']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 404, `${path} should not expose removed demo or APK flows`);
    }
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

void testApi().then(() => {
  console.log('API authorization and web-only endpoint checks passed.');
  process.exit(0);
}).catch((error) => {
  console.error('[FAIL] API endpoint checks failed:', error);
  process.exit(1);
});
