import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { enterpriseApiRouter } from '../../backend/server/routes/api.js';
import { dataStore } from '../../backend/server/db/store.js';
import { AuthService } from '../../backend/server/services/auth.js';

describe('Phase 5: Verified Guardian Dashboard & Shared-Device Family Manager', () => {
  let app: express.Application;
  let server: Server;
  let baseUrl: string;
  let familyId: string;
  let guardianId: string;
  let sibling1Id: string;
  let sibling1RollNumber: string;
  let sibling2Id: string;
  let sibling2RollNumber: string;
  let guardianToken: string;
  let guardianEmail: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api', enterpriseApiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });

  it('1. Parent registers guardian family account sitting above children', async () => {
    guardianEmail = `lakshmi.guardian.${Date.now()}@example.com`;
    const otp = AuthService.generateOtp(guardianEmail, 'registration');
    AuthService.verifyOtp(guardianEmail, 'registration', otp.otp!);
    const res = await fetch(`${baseUrl}/api/auth/register/guardian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lakshmi Varma',
        email: guardianEmail,
        password: 'SecureParentPassword@2026',
        phone: '9848022338',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('guardian');
    expect(data.family).toBeDefined();

    guardianId = data.user.id;
    familyId = data.family.id;
    guardianToken = data.token;
  });

  it('2. Registers Sibling 1 (Class 10 AP SSC, PIN 1111) and Sibling 2 (Class 7 CBSE, PIN 2222) under same family', async () => {
    // Sibling 1: Priya
    const res1 = await fetch(`${baseUrl}/api/family/add-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guardianToken}` },
      body: JSON.stringify({
        fullName: 'Priya Varma',
        pin: '1111',
        securityQuestionId: 'favorite_subject',
        securityAnswer: 'Maths',
        classGrade: 10,
        familyId,
      }),
    });

    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    sibling1Id = data1.student.id;
    sibling1RollNumber = data1.student.loginCode;

    // Sibling 2: Rohan
    const res2 = await fetch(`${baseUrl}/api/family/add-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guardianToken}` },
      body: JSON.stringify({
        fullName: 'Rohan Varma',
        pin: '2222',
        securityQuestionId: 'birth_city',
        securityAnswer: 'Tirupati',
        classGrade: 7,
        familyId,
      }),
    });

    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    sibling2Id = data2.student.id;
    sibling2RollNumber = data2.student.loginCode;
  });

  it('3. Simulates academic activity for Sibling 1 (Quiz Attempt & Assignment Submission)', async () => {
    // Sibling 1 submits a quiz attempt
    const quizAttemptId = 'att_priya_' + Date.now();
    dataStore.quizAttempts.set(quizAttemptId, {
      id: quizAttemptId,
      quizId: 'quiz_maths_ch1',
      studentId: sibling1Id,
      studentName: 'Priya Varma',
      score: 9,
      totalQuestions: 10,
      percentage: 90,
      passed: true,
      selectedAnswers: [1, 2, 0, 3],
      completedAt: Date.now(),
    });

    // Sibling 1 gets a graded assignment
    const subId = 'sub_priya_' + Date.now();
    dataStore.submissions.set(subId, {
      id: subId,
      assignmentId: 'assign_maths_polynomials',
      studentId: sibling1Id,
      studentName: 'Priya Varma',
      contentText: 'Polynomial zeroes derived correctly.',
      status: 'graded',
      marksObtained: 96,
      feedback: 'Splendid algebraic derivation.',
      submittedAt: Date.now() - 3600000,
      gradedAt: Date.now(),
    });
  });

  it('4. GET /api/family/:familyId/overview delivers comprehensive telemetry across both siblings with zero data leakage', async () => {
    const res = await fetch(`${baseUrl}/api/family/${familyId}/overview`, { headers: { Authorization: `Bearer ${guardianToken}` } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.childrenCount).toBe(2);

    const priya = data.children.find((c: any) => c.studentId === sibling1Id);
    const rohan = data.children.find((c: any) => c.studentId === sibling2Id);

    expect(priya).toBeDefined();
    expect(priya.classGrade).toBe(10);
    expect(priya.quizzes.totalAttempted).toBe(1);
    expect(priya.quizzes.averagePercentage).toBe(90);
    expect(priya.assignments.gradedCount).toBe(1);
    expect(priya.assignments.recentFeedback[0].marksObtained).toBe(96);

    expect(rohan).toBeDefined();
    expect(rohan.classGrade).toBe(7);
    // Strict isolation: Sibling 2 shows 0 attempts, not Sibling 1's data
    expect(rohan.quizzes.totalAttempted).toBe(0);
    expect(rohan.assignments.gradedCount).toBe(0);
  });

  it('5. POST /api/family/:familyId/children/:studentId/reset-pin allows guardian to reset forgotten PIN', async () => {
    const res = await fetch(`${baseUrl}/api/family/${familyId}/children/${sibling1Id}/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guardianToken}` },
      body: JSON.stringify({
        newPin: '9999',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset successfully');

    // Verify Sibling 1 can now login with new PIN 9999
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginCode: sibling1RollNumber,
        pin: '9999',
      }),
    });

    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    expect(loginData.user.id).toBe(sibling1Id);
  });

  it('6. Strict shared-device security: old PIN fails after reset', async () => {
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginCode: sibling1RollNumber,
        pin: '1111', // Old PIN
      }),
    });

    expect(oldLoginRes.status).toBe(401);
  });
});
