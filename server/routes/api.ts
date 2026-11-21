// Comprehensive Enterprise Educational Platform API Router
import { Router, Request, Response } from 'express';
import { dataStore } from '../db/store.js';
import { AuthService, requireAuth, requireRole, AuthenticatedRequest } from '../services/auth.js';
import { EmailService } from '../services/email.js';
import { AiGuardrailService } from '../services/aiGuardrails.js';
import { SyllabusProcessorService } from '../services/syllabusProcessor.js';
import { askGroqTutor } from '../services/groq.js';
import { User, UserRole, Institution } from '../../src/types/enterprise.js';

const router = Router();

// ============================================================================
// 1. AUTHENTICATION & ACCOUNT MANAGEMENT
// ============================================================================

// POST /api/auth/login
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Check account lockout
  const lockout = AuthService.checkAccountLockout(normalizedEmail);
  if (lockout.locked) {
    return res.status(429).json({
      error: `Account temporarily locked due to multiple failed login attempts. Please wait ${lockout.waitSeconds}s before trying again.`,
    });
  }

  // Find user
  let matchedUser: (User & { passwordHash: string; salt: string }) | null = null;
  for (const user of dataStore.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    AuthService.recordLoginFailure(normalizedEmail);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Verify password
  const isValid = dataStore.verifyPassword(password, matchedUser.passwordHash, matchedUser.salt);
  if (!isValid) {
    AuthService.recordLoginFailure(normalizedEmail);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Check user status
  if (matchedUser.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact your administrator.' });
  }
  if (matchedUser.status === 'pending_verification') {
    return res.status(403).json({ error: 'Your account is pending email verification. Please verify your OTP.' });
  }

  // Success
  AuthService.recordLoginSuccess(normalizedEmail);
  matchedUser.lastLoginAt = Date.now();

  const token = AuthService.generateToken(matchedUser);

  dataStore.logAudit({
    userId: matchedUser.id,
    userEmail: matchedUser.email,
    institutionId: matchedUser.institutionId,
    category: 'auth',
    action: 'USER_LOGIN_SUCCESS',
    details: { role: matchedUser.role },
  });

  // Role-based dashboard redirect guidance
  const dashboardRoutes: Record<UserRole, string> = {
    super_admin: '/dashboard/super-admin',
    institution_admin: '/dashboard/institution-admin',
    academic_admin: '/dashboard/academic-admin',
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
    guardian: '/dashboard/guardian',
    coordinator: '/dashboard/academic-admin',
    exam_admin: '/dashboard/academic-admin',
  };

  return res.json({
    success: true,
    token,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      fullName: matchedUser.fullName,
      role: matchedUser.role,
      institutionId: matchedUser.institutionId,
      institutionName: matchedUser.institutionName,
      studentProfile: matchedUser.studentProfile,
      teacherProfile: matchedUser.teacherProfile,
    },
    redirectTo: dashboardRoutes[matchedUser.role] || '/dashboard/student',
  });
});

// POST /api/auth/otp/send
router.post('/auth/otp/send', async (req: Request, res: Response) => {
  const { email, purpose = 'registration' } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const { otp, error } = AuthService.generateOtp(email, purpose);
  if (error) {
    return res.status(429).json({ error });
  }

  // Dispatch via EmailJS / simulated mailer
  await EmailService.sendOtpEmail(email, otp, purpose);

  return res.json({
    success: true,
    message: `A 6-digit verification code has been dispatched to ${email}.`,
    cooldownSeconds: 60,
  });
});

// POST /api/auth/otp/verify
router.post('/auth/otp/verify', (req: Request, res: Response) => {
  const { email, code, purpose = 'registration' } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const result = AuthService.verifyOtp(email, purpose, String(code));
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  return res.json({ success: true, message: result.message });
});

// POST /api/auth/register/institution
router.post('/auth/register/institution', async (req: Request, res: Response) => {
  const { name, code, type, contactEmail, contactPhone, address, adminFullName, adminPassword } = req.body;

  if (!name || !code || !contactEmail || !adminPassword) {
    return res.status(400).json({ error: 'Institution name, code, contact email, and admin password are required.' });
  }

  const instId = 'inst_' + String(code).toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);

  const newInst: Institution = {
    id: instId,
    name,
    code: String(code).toUpperCase(),
    type: type || 'college',
    address: address || '',
    contactEmail,
    contactPhone: contactPhone || '',
    status: 'pending', // Requires Super Admin approval
    academicYears: [
      {
        id: 'ay_' + Date.now(),
        institutionId: instId,
        yearLabel: '2025-2026',
        isCurrent: true,
        startDate: '2025-07-01',
        endDate: '2026-05-31',
      },
    ],
    aiPolicy: {
      institutionId: instId,
      maxDailyQueriesStudent: 30,
      blockExamKeywords: true,
      requireSyllabusGrounding: true,
      auditLoggingEnabled: true,
    },
    createdAt: Date.now(),
  };

  dataStore.institutions.set(instId, newInst);

  // Create Institution Administrator (in pending verification state)
  const pwd = dataStore.hashPassword(adminPassword);
  const adminUserId = 'user_admin_' + Date.now().toString(36);

  const adminUser: User & { passwordHash: string; salt: string } = {
    id: adminUserId,
    institutionId: instId,
    institutionName: name,
    fullName: adminFullName || 'Institution Administrator',
    email: contactEmail,
    phone: contactPhone,
    role: 'institution_admin',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
  };

  dataStore.users.set(adminUserId, adminUser);

  // Notify Super Admin
  dataStore.notifications.set('notif_' + Date.now(), {
    id: 'notif_' + Date.now(),
    userId: 'user_super_admin',
    title: 'New Institution Registration',
    message: `${name} (${code}) has submitted an onboarding request.`,
    type: 'security',
    read: false,
    actionUrl: '/dashboard/super-admin',
    createdAt: Date.now(),
  });

  dataStore.logAudit({
    userId: adminUserId,
    institutionId: instId,
    category: 'admin',
    action: 'INSTITUTION_REGISTRATION_SUBMITTED',
    details: { name, code, contactEmail },
  });

  return res.json({
    success: true,
    message: 'Institution registration submitted successfully. Your request has been forwarded to the Platform Super Administrator for verification and approval.',
    institutionId: instId,
  });
});

// POST /api/auth/register/student
router.post('/api/auth/register/student', async (req: Request, res: Response) => {
  const {
    fullName,
    email,
    password,
    institutionId,
    departmentId,
    programmeId,
    admissionYear,
    semester,
    rollNumber,
    guardianEmail,
  } = req.body;

  if (!fullName || !email || !password || !institutionId || !programmeId || !semester) {
    return res.status(400).json({ error: 'Full name, email, password, institution, programme, and semester are required.' });
  }

  // Check if email already registered
  for (const u of dataStore.users.values()) {
    if (u.email.toLowerCase() === String(email).trim().toLowerCase()) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  }

  const inst = dataStore.institutions.get(institutionId);
  if (!inst) {
    return res.status(400).json({ error: 'Invalid institution selected.' });
  }

  const pwd = dataStore.hashPassword(password);
  const studentId = 'user_student_' + Date.now().toString(36);

  const newStudent: User & { passwordHash: string; salt: string } = {
    id: studentId,
    institutionId,
    institutionName: inst.name,
    fullName,
    email: String(email).trim().toLowerCase(),
    role: 'student',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
    studentProfile: {
      userId: studentId,
      institutionId,
      departmentId: departmentId || 'dept_cse',
      programmeId,
      admissionYear: admissionYear || '2024',
      semester: parseInt(semester, 10) || 1,
      rollNumber: rollNumber || `STD-${Date.now().toString().slice(-4)}`,
      guardianEmail: guardianEmail || undefined,
      attendancePercent: 100,
      completedTopicIds: [],
    },
  };

  dataStore.users.set(studentId, newStudent);

  const token = AuthService.generateToken(newStudent);

  return res.json({
    success: true,
    message: 'Student account registered and activated successfully!',
    token,
    user: {
      id: newStudent.id,
      fullName: newStudent.fullName,
      email: newStudent.email,
      role: newStudent.role,
      institutionId: newStudent.institutionId,
      institutionName: newStudent.institutionName,
      studentProfile: newStudent.studentProfile,
    },
    redirectTo: '/dashboard/student',
  });
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dataStore.users.get(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  return res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
    institutionName: user.institutionName,
    studentProfile: user.studentProfile,
    teacherProfile: user.teacherProfile,
  });
});

// ============================================================================
// 2. PLATFORM SUPER ADMINISTRATOR (LEVEL 1)
// ============================================================================

// GET /api/super-admin/institutions
router.get('/super-admin/institutions', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  const list = Array.from(dataStore.institutions.values());
  return res.json(list);
});

// POST /api/super-admin/institutions/:id/approve
router.post('/super-admin/institutions/:id/approve', requireAuth, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const instId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const inst = dataStore.institutions.get(instId);
  if (!inst) return res.status(404).json({ error: 'Institution not found.' });

  inst.status = 'approved';
  inst.approvedAt = Date.now();

  // Send approval email
  await EmailService.sendInstitutionStatusEmail(inst.contactEmail, inst.name, 'approved');

  dataStore.logAudit({
    userId: req.user!.userId,
    category: 'admin',
    action: 'INSTITUTION_APPROVED',
    details: { institutionId: inst.id, name: inst.name },
  });

  return res.json({ success: true, message: `Institution ${inst.name} approved successfully.` });
});

// POST /api/super-admin/institutions/:id/reject
router.post('/super-admin/institutions/:id/reject', requireAuth, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { reason = 'Information verification incomplete.' } = req.body;
  const instId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const inst = dataStore.institutions.get(instId);
  if (!inst) return res.status(404).json({ error: 'Institution not found.' });

  inst.status = 'rejected';
  inst.rejectionReason = reason;

  await EmailService.sendInstitutionStatusEmail(inst.contactEmail, inst.name, 'rejected', reason);

  return res.json({ success: true, message: `Institution ${inst.name} rejected.` });
});

// GET /api/super-admin/stats
router.get('/super-admin/stats', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  const institutions = Array.from(dataStore.institutions.values());
  const users = Array.from(dataStore.users.values());

  const stats = {
    totalInstitutions: institutions.length,
    approvedInstitutions: institutions.filter((i) => i.status === 'approved').length,
    pendingInstitutions: institutions.filter((i) => i.status === 'pending').length,
    totalUsers: users.length,
    studentsCount: users.filter((u) => u.role === 'student').length,
    teachersCount: users.filter((u) => u.role === 'teacher').length,
    adminsCount: users.filter((u) => u.role === 'institution_admin' || u.role === 'academic_admin').length,
    totalSubjects: dataStore.subjects.size,
    totalAuditLogs: dataStore.auditLogs.length,
  };

  return res.json(stats);
});

// GET /api/super-admin/audit-logs
router.get('/super-admin/audit-logs', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {
  return res.json(dataStore.auditLogs.slice(0, 100));
});

// ============================================================================
// 3. INSTITUTION & ACADEMIC HIERARCHY (LEVEL 2 & LEVEL 3)
// ============================================================================

// GET /api/institution/public/list - For registration dropdowns
router.get('/institution/public/list', (req: Request, res: Response) => {
  const approved = Array.from(dataStore.institutions.values())
    .filter((i) => i.status === 'approved')
    .map((i) => ({ id: i.id, name: i.name, code: i.code, type: i.type }));
  return res.json(approved);
});

// GET /api/institution/:id/departments
router.get('/institution/:id/departments', (req: Request, res: Response) => {
  const depts = Array.from(dataStore.departments.values()).filter((d) => d.institutionId === req.params.id);
  return res.json(depts);
});

// GET /api/institution/:id/programmes
router.get('/institution/:id/programmes', (req: Request, res: Response) => {
  const progs = Array.from(dataStore.programmes.values()).filter((p) => p.institutionId === req.params.id);
  return res.json(progs);
});

// POST /api/institution/:id/invite-teacher
router.post('/institution/:id/invite-teacher', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { email, fullName, departmentId, designation } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Teacher email and full name are required.' });
  }

  const instId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const inst = dataStore.institutions.get(instId);
  if (!inst) return res.status(404).json({ error: 'Institution not found.' });

  const teacherId = 'user_teacher_' + Date.now().toString(36);
  const pwd = dataStore.hashPassword('Teacher@2026');

  const newTeacher: User & { passwordHash: string; salt: string } = {
    id: teacherId,
    institutionId: inst.id,
    institutionName: inst.name,
    fullName,
    email: String(email).trim().toLowerCase(),
    role: 'teacher',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
    teacherProfile: {
      userId: teacherId,
      institutionId: inst.id,
      departmentId: departmentId || 'dept_cse',
      designation: designation || 'Assistant Professor',
      qualifications: 'M.Tech / Ph.D',
      assignedSubjectIds: [],
    },
  };

  dataStore.users.set(teacherId, newTeacher);

  await EmailService.sendTeacherInviteEmail(newTeacher.email, fullName, inst.name, 'Computer Science', 'Teacher@2026');

  return res.json({ success: true, message: `Invitation sent to ${email}`, teacherId });
});

// ============================================================================
// 4. INTELLIGENT STUDENT-BASED SYLLABUS & ACADEMIC MANAGEMENT
// ============================================================================

// GET /api/academic/student-syllabus
// Dynamically fetches the syllabus matching student's verified profile
router.get('/academic/student-syllabus', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dataStore.users.get(req.user!.userId);
  if (!user || !user.studentProfile) {
    // If called by an admin or teacher, check query parameters
    const institutionId = String(req.query.institutionId || 'inst_ait_hyd');
    const programmeId = String(req.query.programmeId || 'prog_btech_cse');
    const semester = parseInt(String(req.query.semester || '5'), 10);

    const subjects = Array.from(dataStore.subjects.values()).filter(
      (s) => s.institutionId === institutionId && s.programmeId === programmeId && s.semester === semester
    );

    return res.json({
      institutionId,
      programmeId,
      semester,
      matched: subjects.length > 0,
      subjects,
    });
  }

  const profile = user.studentProfile;
  const matchedSubjects = Array.from(dataStore.subjects.values()).filter(
    (s) => s.institutionId === profile.institutionId && s.programmeId === profile.programmeId && s.semester === profile.semester
  );

  return res.json({
    studentName: user.fullName,
    rollNumber: profile.rollNumber,
    institutionId: profile.institutionId,
    programmeId: profile.programmeId,
    semester: profile.semester,
    matched: matchedSubjects.length > 0,
    attendancePercent: profile.attendancePercent,
    completedTopicIds: profile.completedTopicIds,
    subjects: matchedSubjects,
  });
});

// POST /api/academic/syllabus/parse - Extract structured units from syllabus text/document
router.post('/academic/syllabus/parse', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), (req: Request, res: Response) => {
  const { text, institutionId, departmentId, programmeId, semester, syllabusVersion } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Syllabus content text is required for processing.' });
  }

  const draft = SyllabusProcessorService.processSyllabusText(text, {
    institutionId: institutionId || 'inst_ait_hyd',
    departmentId: departmentId || 'dept_cse',
    programmeId: programmeId || 'prog_btech_cse',
    semester: parseInt(semester, 10) || 5,
    syllabusVersion,
  });

  return res.json({ success: true, draft });
});

// POST /api/academic/syllabus/publish - Admin approves & publishes syllabus to active DB
router.post('/academic/syllabus/publish', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), (req: AuthenticatedRequest, res: Response) => {
  const { draft, institutionId, departmentId } = req.body;
  if (!draft || !draft.subjectName || !draft.units) {
    return res.status(400).json({ error: 'Invalid syllabus draft format.' });
  }

  const newSubject = SyllabusProcessorService.publishSyllabus(
    institutionId || req.user!.institutionId || 'inst_ait_hyd',
    departmentId || 'dept_cse',
    draft
  );

  return res.json({
    success: true,
    message: `Syllabus for ${newSubject.name} (${newSubject.code}) published successfully!`,
    subject: newSubject,
  });
});

// ============================================================================
// 5. INTELLIGENT LMS (RESOURCES, ASSIGNMENTS, QUIZZES, LIVE CLASSES)
// ============================================================================

// GET /api/lms/subjects/:subjectId/overview
router.get('/lms/subjects/:subjectId/overview', (req: Request, res: Response) => {
  const subjectId = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  const subject = dataStore.subjects.get(subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });

  const resources = Array.from(dataStore.learningResources.values()).filter((r) => r.subjectId === subject.id);
  const assignments = Array.from(dataStore.assignments.values()).filter((a) => a.subjectId === subject.id);
  const quizzes = Array.from(dataStore.quizzes.values()).filter((q) => q.subjectId === subject.id);

  return res.json({
    subject,
    resources,
    assignments,
    quizzes,
  });
});

// POST /api/lms/subjects/:subjectId/resources
router.post('/lms/subjects/:subjectId/resources', requireAuth, requireRole(['teacher', 'academic_admin', 'institution_admin', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const { unitId, topicId, resourceType, title, description, contentText, fileUrl, videoUrl, meetingUrl, scheduledAt } = req.body;

  if (!title || !resourceType) {
    return res.status(400).json({ error: 'Title and resourceType are required.' });
  }

  const user = dataStore.users.get(req.user!.userId);

  const resId = 'res_' + Date.now().toString(36);
  const resource = {
    id: resId,
    subjectId: req.params.subjectId,
    unitId: unitId || 'unit_1',
    topicId,
    teacherId: req.user!.userId,
    teacherName: user?.fullName || 'Instructor',
    resourceType,
    title,
    description: description || '',
    contentText,
    fileUrl,
    videoUrl,
    meetingUrl,
    scheduledAt: scheduledAt ? parseInt(scheduledAt, 10) : undefined,
    createdAt: Date.now(),
  };

  dataStore.learningResources.set(resId, resource as any);

  return res.json({ success: true, message: 'Resource added successfully.', resource });
});

// POST /api/lms/assignments/:id/submit
router.post('/lms/assignments/:id/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { contentText, fileUrl } = req.body;
  const user = dataStore.users.get(req.user!.userId);

  const subId = 'sub_' + req.params.id + '_' + req.user!.userId;
  const submission = {
    id: subId,
    assignmentId: req.params.id,
    studentId: req.user!.userId,
    studentName: user?.fullName || 'Student',
    contentText: contentText || '',
    fileUrl,
    status: 'submitted',
    submittedAt: Date.now(),
  };

  dataStore.submissions.set(subId, submission as any);

  return res.json({ success: true, message: 'Assignment submitted successfully!', submission });
});

// POST /api/lms/quizzes/:id/attempt
router.post('/lms/quizzes/:id/attempt', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const quizId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quiz = dataStore.quizzes.get(quizId);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

  const { selectedAnswers = [] } = req.body;
  const user = dataStore.users.get(req.user!.userId);

  let score = 0;
  quiz.questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctOptionIndex) {
      score += 1;
    }
  });

  const percentage = Math.round((score / quiz.questions.length) * 100);
  const passed = percentage >= quiz.passPercentage;

  const attemptId = 'att_' + quiz.id + '_' + Date.now().toString(36);
  const attempt = {
    id: attemptId,
    quizId: quiz.id,
    studentId: req.user!.userId,
    studentName: user?.fullName || 'Student',
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    selectedAnswers,
    completedAt: Date.now(),
  };

  dataStore.quizAttempts.set(attemptId, attempt as any);

  return res.json({
    success: true,
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    questionsFeedback: quiz.questions.map((q, idx) => ({
      questionId: q.id,
      text: q.text,
      userAnswer: selectedAnswers[idx],
      correctAnswer: q.correctOptionIndex,
      isCorrect: selectedAnswers[idx] === q.correctOptionIndex,
      explanation: q.explanation,
    })),
  });
});

// POST /api/lms/topics/:topicId/toggle-complete
router.post('/lms/topics/:topicId/toggle-complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dataStore.users.get(req.user!.userId);
  if (!user || !user.studentProfile) {
    return res.status(400).json({ error: 'Only student accounts can track topic completion.' });
  }

  const topicId = Array.isArray(req.params.topicId) ? req.params.topicId[0] : req.params.topicId;
  const completed = user.studentProfile.completedTopicIds || [];
  const idx = completed.indexOf(topicId);

  let isComplete = false;
  if (idx === -1) {
    completed.push(topicId);
    isComplete = true;
  } else {
    completed.splice(idx, 1);
    isComplete = false;
  }

  user.studentProfile.completedTopicIds = completed;

  return res.json({ success: true, completed: isComplete, completedTopicIds: completed });
});

// ============================================================================
// 6. RESPONSIBLE AI TUTOR WITH MULTI-TIER GUARDRAILS
// ============================================================================

// POST /api/tutor/chat
router.post('/tutor/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { query, subjectId, unitTitle, topicTitle } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query prompt is required.' });
  }

  const user = req.user!;
  const subject = subjectId ? dataStore.subjects.get(subjectId) : null;
  const subjectName = subject ? subject.name : 'Computer Science & Mathematics';

  // 1. Enforce Application & Backend Guardrails
  const check = AiGuardrailService.inspectQuery(
    user.userId,
    String(query),
    user.institutionId,
    user.role
  );

  if (!check.allowed) {
    return res.json({
      answer: check.blockedReason,
      flagged: true,
      flagCategory: check.flagCategory,
      pedagogicalGuide: true,
    });
  }

  // 2. If it's a homework answer dumping attempt, nudge Socratic method
  if (check.pedagogicalNudge) {
    return res.json({
      answer: check.pedagogicalNudge,
      flagged: false,
      isSocraticNudge: true,
    });
  }

  // 3. Build syllabus-grounded system prompt
  const systemPrompt = AiGuardrailService.buildPedagogicalSystemPrompt(subjectName, unitTitle, topicTitle);

  try {
    const aiResponse = await askGroqTutor(query, systemPrompt);
    return res.json({
      answer: aiResponse,
      flagged: false,
      groundedSubject: subjectName,
    });
  } catch (err: any) {
    // Socratic Fallback
    return res.json({
      answer: `Let's break this down step-by-step for ${subjectName}. What is the primary definition or theorem relevant to your question? Try explaining your first thoughts, and I will guide you to the full solution!`,
      flagged: false,
      fallback: true,
    });
  }
});

// ============================================================================
// 7. NOTIFICATIONS & ANNOUNCEMENTS
// ============================================================================

// GET /api/notifications
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userNotifs = Array.from(dataStore.notifications.values())
    .filter((n) => n.userId === req.user!.userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return res.json(userNotifs);
});

// POST /api/notifications/:id/read
router.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const notif = dataStore.notifications.get(notifId);
  if (notif && notif.userId === req.user!.userId) {
    notif.read = true;
  }
  return res.json({ success: true });
});

// GET /api/announcements
router.get('/announcements', (req: Request, res: Response) => {
  const annList = Array.from(dataStore.announcements.values()).sort((a, b) => b.createdAt - a.createdAt);
  return res.json(annList);
});

export { router as enterpriseApiRouter };
