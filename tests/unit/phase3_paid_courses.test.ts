import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { enterpriseApiRouter } from '../../server/routes/api.js';

describe('Phase 3: Institution Dynamic Paid Course Builder (Classes 11+)', () => {
  let app: express.Application;
  let server: Server;
  let baseUrl: string;

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

  it('1. POST /api/institution/courses strictly forces isFree=true and feeAmount=0 if classGrade <= 10', async () => {
    const res = await fetch(`${baseUrl}/api/institution/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'AIT-09-SCI',
        title: 'Class 9 Integrated Science',
        institutionId: 'inst_ait_hyd',
        classGrade: 9,
        board: 'CBSE',
        state: 'Telangana',
        subjectName: 'Science',
        language: 'en',
        description: 'Middle school physics and chemistry foundations.',
        isFree: false, // Attempted paywall
        feeAmount: 1500, // Attempted fee
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.course.isFree).toBe(true);
    expect(data.course.feeAmount).toBe(0);
    expect(data.message).toContain('Mandatory Free Tier');
  });

  it('2. POST /api/institution/courses permits dynamic paid plans for Class 11 and Class 12', async () => {
    const res = await fetch(`${baseUrl}/api/institution/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'AIT-12-PHY',
        title: 'Class 12 Advanced Physics & JEE Foundations',
        institutionId: 'inst_ait_hyd',
        classGrade: 12,
        board: 'CBSE',
        state: 'Telangana',
        subjectName: 'Physics',
        language: 'en',
        description: 'Comprehensive senior secondary physics with test series.',
        isFree: false,
        feeAmount: 2499,
        feeCurrency: 'INR',
        billingCycle: 'term',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.course.isFree).toBe(false);
    expect(data.course.feeAmount).toBe(2499);
    expect(data.course.feeCurrency).toBe('INR');
  });

  it('3. GET /api/institution/:institutionId/courses lists all offerings for an institution', async () => {
    const res = await fetch(`${baseUrl}/api/institution/inst_ait_hyd/courses`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.courses.length).toBeGreaterThanOrEqual(2);
  });

  it('4. POST /api/institution/courses/:id/enroll marks status as pending_payment when unpaid for Class 12 paid course', async () => {
    // 1. Fetch Class 12 course
    const listRes = await fetch(`${baseUrl}/api/institution/inst_ait_hyd/courses?classGrade=12`);
    const listData = await listRes.json();
    const paidCourseId = listData.courses[0].id;

    // 2. Enroll without payment
    const enrollRes = await fetch(`${baseUrl}/api/institution/courses/${paidCourseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'student_aditya_12th',
        paymentConfirmed: false,
      }),
    });

    expect(enrollRes.status).toBe(201);
    const enrollData = await enrollRes.json();
    expect(enrollData.success).toBe(true);
    expect(enrollData.paymentRequired).toBe(true);
    expect(enrollData.enrollment.status).toBe('pending_payment');
  });

  it('5. POST /api/institution/courses/:id/enroll grants active status when payment is confirmed', async () => {
    const listRes = await fetch(`${baseUrl}/api/institution/inst_ait_hyd/courses?classGrade=12`);
    const listData = await listRes.json();
    const paidCourseId = listData.courses[0].id;

    const enrollRes = await fetch(`${baseUrl}/api/institution/courses/${paidCourseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'student_vikram_paid',
        paymentConfirmed: true,
        paymentReference: 'UPI_TXN_9876543210',
      }),
    });

    expect(enrollRes.status).toBe(201);
    const enrollData = await enrollRes.json();
    expect(enrollData.success).toBe(true);
    expect(enrollData.paymentRequired).toBe(false);
    expect(enrollData.enrollment.status).toBe('active');
    expect(enrollData.enrollment.paymentReference).toBe('UPI_TXN_9876543210');
  });
});
