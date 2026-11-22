import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dataStore } from '../../server/db/store.js';
import { enterpriseApiRouter } from '../../server/routes/api.js';
import express from 'express';

describe('Phase 1: Canonical RBAC & Multi-Role Onboarding Suite', () => {
  let app: express.Express;
  let server: any;
  let port: number = 3004;
  let guardianToken: string;
  let guardianFamilyId: string;
  let studentRollNumber: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api', enterpriseApiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // 1. Guardian Family Account Registration
  it('registers a Parent/Guardian account and auto-provisions Family record', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register/guardian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lakshmi Reddy',
        email: 'lakshmi.parent@test.com',
        password: 'Password@2026',
        phone: '+91 9876543210',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log('Error payload:', res.status, data);
    }
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('guardian');
    expect(data.family.id).toBeDefined();
    expect(data.family.primaryGuardianId).toBe(data.user.id);

    guardianToken = data.token;
    guardianFamilyId = data.family.id;
  });

  // 2. Student Zero-PII Registration under Guardian (Free Class 1-10)
  it('registers a student sibling under the Guardian family account with Zero-PII 4-digit PIN', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sai Reddy',
        classGrade: 10,
        board: 'Andhra Pradesh SSC',
        state: 'Andhra Pradesh',
        pin: '4321',
        isIndependent: true,
        familyId: guardianFamilyId,
        securityQuestionId: 'subject',
        securityQuestion: 'What is your favorite school subject?',
        securityAnswer: 'Maths',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('student');
    expect(data.user.studentProfile.classGrade).toBe(10);
    expect(data.user.studentProfile.isIndependent).toBe(true);
    expect(data.user.studentProfile.rollNumber).toBeDefined();

    studentRollNumber = data.user.studentProfile.rollNumber;
  });

  // 3. Student Login with Roll Number & 4-Digit PIN
  it('logs in student using Roll Number / Login Code and 4-digit PIN', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginCode: studentRollNumber,
        pin: '4321',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('student');
    expect(data.redirectTo).toBe('/learn');
  });

  // 4. Guardian Login with Email and Password
  it('logs in Parent/Guardian using Email and Password and routes to /guardian', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lakshmi.parent@test.com',
        password: 'Password@2026',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('guardian');
    expect(data.redirectTo).toBe('/guardian');
  });

  // 5. Zero-PII Student PIN Reset via Security Question
  it('fetches safety question and resets student 4-digit PIN without email or phone OTP', async () => {
    // Step A: Fetch question
    const qRes = await fetch(`http://127.0.0.1:${port}/api/auth/student/safety-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginCode: studentRollNumber }),
    });
    const qData = await qRes.json();
    expect(qRes.status).toBe(200);
    expect(qData.success).toBe(true);
    expect(qData.securityQuestion).toBe('What is your favorite school subject?');

    // Step B: Reset PIN with valid answer (using Telugu synonym 'లెక్కలు')
    const resetRes = await fetch(`http://127.0.0.1:${port}/api/auth/student/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginCode: studentRollNumber,
        securityAnswer: 'లెక్కలు',
        newPin: '9999',
      }),
    });
    const resetData = await resetRes.json();
    expect(resetRes.status).toBe(200);
    expect(resetData.success).toBe(true);

    // Step C: Verify login with new PIN
    const newLoginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginCode: studentRollNumber,
        pin: '9999',
      }),
    });
    const newLoginData = await newLoginRes.json();
    expect(newLoginRes.status).toBe(200);
    expect(newLoginData.success).toBe(true);
  });
});
