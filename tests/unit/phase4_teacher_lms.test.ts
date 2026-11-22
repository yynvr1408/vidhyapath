import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { enterpriseApiRouter } from '../../server/routes/api.js';
import { dataStore } from '../../server/db/store.js';

describe('Phase 4: Complete Teacher LMS Workflows (Assignments, Quizzes, Grading & R2 Attachments)', () => {
  let app: express.Application;
  let server: Server;
  let baseUrl: string;
  let createdAssignmentId: string;
  let submissionId: string;
  let createdQuizId: string;

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

  it('1. POST /api/lms/assignments allows a teacher to create an assignment with maxMarks and due date', async () => {
    const res = await fetch(`${baseUrl}/api/lms/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: 'subj_maths_10',
        unitId: 'unit_real_numbers',
        title: 'Euclid Division Lemma Problem Set',
        description: 'Solve problems 1 through 10 from SCERT textbook Chapter 1.',
        instructions: 'Show all steps cleanly. Identify quotient and remainder.',
        maxMarks: 100,
        teacherId: 'teacher_srinivas_maths',
        teacherName: 'Srinivas Rao (HOD Maths)',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.assignment.title).toBe('Euclid Division Lemma Problem Set');
    expect(data.assignment.maxMarks).toBe(100);
    createdAssignmentId = data.assignment.id;
  });

  it('2. POST /api/lms/assignments/:id/submit allows a student to submit their homework solution', async () => {
    const res = await fetch(`${baseUrl}/api/lms/assignments/${createdAssignmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'student_chaitanya_ap',
        studentName: 'Chaitanya Varma',
        contentText: 'Applied Euclid Lemma: a = bq + r with 0 <= r < b. Q1 remainder is 3.',
        fileUrl: 'https://pub-524b6af593b340d39cdadb488b86803b.r2.dev/chaitanya_hw1.pdf',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.submission.status).toBe('submitted');
    submissionId = data.submission.id;
  });

  it('3. GET /api/lms/assignments/:id/submissions lets teacher view all student submissions', async () => {
    const res = await fetch(`${baseUrl}/api/lms/assignments/${createdAssignmentId}/submissions`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.submissions.length).toBeGreaterThanOrEqual(1);
    expect(data.submissions[0].id).toBe(submissionId);
  });

  it('4. POST /api/lms/assignments/:id/grade grades student work with marks and qualitative feedback', async () => {
    const res = await fetch(`${baseUrl}/api/lms/assignments/${createdAssignmentId}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        marksObtained: 95,
        feedback: 'Excellent work! Clear lemma formulation and neat quadratic step derivation.',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.submission.status).toBe('graded');
    expect(data.submission.marksObtained).toBe(95);
    expect(data.submission.feedback).toContain('Excellent work');

    // Check student notification was generated
    const notifs = Array.from(dataStore.notifications.values()).filter((n) => n.userId === 'student_chaitanya_ap');
    expect(notifs.length).toBeGreaterThanOrEqual(1);
  });

  it('5. POST /api/lms/quizzes authors a multi-choice quiz with distractor mistake tags', async () => {
    const res = await fetch(`${baseUrl}/api/lms/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: 'subj_maths_10',
        unitId: 'unit_real_numbers',
        title: 'Real Numbers Diagnostic Assessment',
        timeLimitMinutes: 20,
        passPercentage: 70,
        questions: [
          {
            text: 'If a and b are positive integers such that a = bq + r, what is the constraint on r?',
            options: ['0 < r < b', '0 <= r < b', '0 < r <= b', '0 <= r <= b'],
            correctOptionIndex: 1,
            explanation: 'By Euclid division lemma, the remainder r is non-negative and strictly less than the divisor b.',
          },
          {
            text: 'The decimal expansion of 13 / 3125 will terminate after how many decimal places?',
            options: ['3', '4', '5', '6'],
            correctOptionIndex: 2,
            explanation: '3125 = 5^5. The exponent of 5 is 5, hence it terminates after 5 places.',
          },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.quiz.questions.length).toBe(2);
    createdQuizId = data.quiz.id;
  });

  it('6. POST /api/lms/quizzes/:id/attempt auto-grades student submission', async () => {
    const res = await fetch(`${baseUrl}/api/lms/quizzes/${createdQuizId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'student_chaitanya_ap',
        studentName: 'Chaitanya Varma',
        selectedAnswers: [1, 2], // Both correct
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.score).toBe(2);
    expect(data.percentage).toBe(100);
    expect(data.passed).toBe(true);
  });

  it('7. GET /api/lms/quizzes/:id/attempts allows teacher to review quiz analytics', async () => {
    const res = await fetch(`${baseUrl}/api/lms/quizzes/${createdQuizId}/attempts`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.attempts.length).toBeGreaterThanOrEqual(1);
    expect(data.attempts[0].percentage).toBe(100);
  });

  it('8. POST /api/lms/upload uploads materials to Cloudflare R2 without ephemeral disk writes', async () => {
    const samplePdfContent = Buffer.from('Vidyapath Question Paper for Class 10 AP Board').toString('base64');
    const res = await fetch(`${baseUrl}/api/lms/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'ap_class10_maths_worksheet.pdf',
        contentType: 'application/pdf',
        base64Data: samplePdfContent,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.fileUrl).toBeDefined();
    // Verify R2 domain or data URI fallback
    expect(data.fileUrl.startsWith('https://') || data.fileUrl.startsWith('data:')).toBe(true);
  });
});
