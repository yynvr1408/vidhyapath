import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { enterpriseApiRouter } from '../../backend/server/routes/api.js';
import { dataStore } from '../../backend/server/db/store.js';
import { authHeaders, createTestAccount } from '../helpers/enterprise_auth';

describe('Phase 2: Global Course Catalog & State SSC / CBSE Engine (Classes 1-10 Free Tier)', () => {
  let app: express.Application;
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let studentToken: string;
  let class10CourseId: string;

  beforeAll(async () => {
    adminToken = createTestAccount('super_admin', 'unit_global_catalog_admin').token;
    const student = createTestAccount('student', 'unit_global_catalog_student', 'inst_global');
    student.user.studentProfile!.isIndependent = true;
    student.user.studentProfile!.classGrade = 10;
    studentToken = student.token;
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

    const seedResponse = await fetch(`${baseUrl}/api/courses/global/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code: 'AP-SSC-10-MATHS', title: 'AP State Board SSC Mathematics', classGrade: 10, board: 'State SSC', state: 'Andhra Pradesh', subjectName: 'Mathematics', language: 'te', description: 'Test fixture course.', isFree: true, feeAmount: 0 }),
    });
    expect(seedResponse.status).toBe(201);
    class10CourseId = (await seedResponse.json()).course.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });

  it('1. GET /api/courses/global returns seeded courses with Classes 1-10 all guaranteed 100% Free', async () => {
    const res = await fetch(`${baseUrl}/api/courses/global`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.courses.length).toBeGreaterThan(0);

    // Every course for Class 1 to 10 must be strictly 100% Free
    for (const course of data.courses) {
      if (course.classGrade && course.classGrade <= 10) {
        expect(course.isFree).toBe(true);
        expect(course.feeAmount).toBe(0);
      }
    }
  });

  it('2. GET /api/courses/global correctly filters by classGrade, board, state, and language', async () => {
    // Filter AP SSC Class 10 in Telugu
    const res = await fetch(`${baseUrl}/api/courses/global?classGrade=10&board=State%20SSC&state=Andhra%20Pradesh&language=te`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.courses.length).toBeGreaterThanOrEqual(1);

    const apCourse = data.courses.find((c: any) => c.code === 'AP-SSC-10-MATHS');
    expect(apCourse).toBeDefined();
    expect(apCourse.title).toContain('AP State Board SSC');
    expect(apCourse.language).toBe('te');
    expect(apCourse.isFree).toBe(true);
  });

  it('3. POST /api/courses/global/publish forces isFree=true and feeAmount=0 for Classes 1 to 10 even if fee is sent', async () => {
    // Attempt to publish a Class 6 course with a paid fee of 999 INR
    const res = await fetch(`${baseUrl}/api/courses/global/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        code: 'MH-SSC-06-MATHS',
        title: 'Class 6 Mathematics (Maharashtra State SSC)',
        classGrade: 6,
        board: 'State SSC',
        state: 'Maharashtra',
        subjectName: 'Mathematics',
        language: 'mr',
        description: 'Middle school algebra foundations.',
        isFree: false, // Attempted paywall
        feeAmount: 999, // Attempted fee
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Strict business policy override:
    expect(data.course.isFree).toBe(true);
    expect(data.course.feeAmount).toBe(0);
    expect(data.course.classGrade).toBe(6);
    expect(data.message).toContain('Mandatory 100% Free Tier');
  });

  it('4. POST /api/courses/global/publish permits paid courses for Class 11+ and Higher Ed', async () => {
    const res = await fetch(`${baseUrl}/api/courses/global/publish`, {
      method: 'POST',
      headers: authHeaders(adminToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        code: 'CBSE-12-PHY',
        title: 'Class 12 Physics & Advanced Electromagnetism',
        classGrade: 12,
        board: 'CBSE',
        state: 'All India',
        subjectName: 'Physics',
        language: 'en',
        description: 'Advanced Senior Secondary Physics preparation.',
        isFree: false,
        feeAmount: 1999,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.course.isFree).toBe(false);
    expect(data.course.feeAmount).toBe(1999);
    expect(data.course.classGrade).toBe(12);
  });

  it('5. POST /api/courses/global/:id/enroll allows an independent student to enroll into a Class 10 course freely', async () => {
    // First, find the Class 10 AP course
    // Enroll independent student
    const enrollRes = await fetch(`${baseUrl}/api/courses/global/${class10CourseId}/enroll`, {
      method: 'POST',
      headers: authHeaders(studentToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });

    expect(enrollRes.status).toBe(201);
    const enrollData = await enrollRes.json();
    expect(enrollData.success).toBe(true);
    expect(enrollData.enrollment.status).toBe('active');
    expect(enrollData.course.isFree).toBe(true);
  });
});
