// Comprehensive Enterprise Educational Platform API Router
import { Router, Request, Response } from 'express';
import { dataStore } from '../db/store.js';
import { AuthService, requireAuth, requireRole, AuthenticatedRequest, TokenPayload } from '../services/auth.js';
import { EmailService } from '../services/email.js';
import { AiGuardrailService } from '../services/aiGuardrails.js';
import { SyllabusProcessorService } from '../services/syllabusProcessor.js';
import { askGroqTutor } from '../services/groq.js';
import {
  User,
  UserRole,
  Institution,
  Family,
  FamilyMember,
  Guardianship,
  Course,
  CourseEnrollment,
  AiConversation,
  AiMessage,
} from '../../src/types/enterprise.js';

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

  const isEmailConfigured = EmailService.isConfigured();
  return res.json({
    success: true,
    message: isEmailConfigured
      ? `A 6-digit verification code has been dispatched to ${email}.`
      : `[Simulated Mode] EmailJS not configured. Verification code: ${otp}`,
    cooldownSeconds: 60,
    ...(isEmailConfigured ? {} : { simulated: true, devOtp: otp }),
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

// POST /api/auth/password-reset/request & POST /api/admin/auth/forgot-password
const handlePasswordResetRequest = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'A valid administrator email address is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let matchedUser: (User & { passwordHash: string; salt: string }) | null = null;
  for (const user of dataStore.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      matchedUser = user;
      break;
    }
  }

  // Generate 6-digit OTP
  const { otp, error } = AuthService.generateOtp(normalizedEmail, 'password_reset');
  if (error) {
    return res.status(429).json({ error });
  }

  const adminName = matchedUser ? matchedUser.fullName : 'Administrator';
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Dispatch rich HTML email template
  await EmailService.sendPasswordResetOtpEmail(
    normalizedEmail,
    adminName,
    otp,
    15,
    clientIp
  );

  const isEmailConfigured = EmailService.isConfigured();
  return res.json({
    success: true,
    message: isEmailConfigured
      ? `A password reset code has been dispatched to ${normalizedEmail}.`
      : `[Simulated Mode] EmailJS not configured. Reset code: ${otp}`,
    cooldownSeconds: 60,
    ...(isEmailConfigured ? {} : { simulated: true, devOtp: otp }),
  });
};

router.post('/auth/password-reset/request', handlePasswordResetRequest);
router.post('/admin/auth/forgot-password', handlePasswordResetRequest);

// POST /api/auth/password-reset/confirm & POST /api/admin/auth/reset-password
const handlePasswordResetConfirm = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Verify OTP
  const verifyResult = AuthService.verifyOtp(normalizedEmail, 'password_reset', String(code));
  if (!verifyResult.success) {
    return res.status(400).json({ error: verifyResult.message });
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
    return res.status(404).json({ error: 'Administrator account not found.' });
  }

  // Hash new password and update
  const pwd = dataStore.hashPassword(newPassword);
  matchedUser.passwordHash = pwd.hash;
  matchedUser.salt = pwd.salt;

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Send success confirmation email
  await EmailService.sendPasswordResetSuccessEmail(
    normalizedEmail,
    matchedUser.fullName,
    clientIp
  );

  dataStore.logAudit({
    userId: matchedUser.id,
    userEmail: matchedUser.email,
    institutionId: matchedUser.institutionId,
    category: 'auth',
    action: 'ADMIN_PASSWORD_RESET_SUCCESS',
    details: { email: normalizedEmail },
  });

  return res.json({
    success: true,
    message: 'Administrator password has been reset successfully. You may now log in.',
  });
};

router.post('/auth/password-reset/confirm', handlePasswordResetConfirm);
router.post('/admin/auth/reset-password', handlePasswordResetConfirm);

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

  // Dispatch rich HTML onboarding email to the administrator
  await EmailService.sendAdminRegistrationEmail(
    contactEmail,
    adminFullName || 'Institution Administrator',
    name,
    String(code).toUpperCase(),
    'institution_admin',
    adminPassword
  );

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

// POST /api/auth/register/student (supports both /auth/register/student and /api/auth/register/student)
router.post(['/auth/register/student', '/api/auth/register/student'], async (req: Request, res: Response) => {
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
  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const user = dataStore.users.get(req.user!.userId);
  const subject = dataStore.subjects.get(assignment.subjectId);
  if (user?.institutionId && subject?.institutionId && user.institutionId !== subject.institutionId) {
    return res.status(403).json({ error: 'You are not enrolled in the institution offering this assignment.' });
  }

  const { contentText, fileUrl } = req.body;
  const subId = 'sub_' + assignmentId + '_' + req.user!.userId;
  const submission = {
    id: subId,
    assignmentId,
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

// Helper for optional or required caller authentication and ownership verification
function optionalOrRequiredAuth(req: Request): TokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const payload = AuthService.verifyToken(token);
  if (payload) {
    (req as AuthenticatedRequest).user = payload;
  }
  return payload;
}

// ============================================================================
// 8. FAMILY MANAGEMENT & MULTI-STUDENT SIBLING PROFILES
// ============================================================================

// POST /api/family/create
router.post('/family/create', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  if (user && user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot create family accounts.' });
  }

  const { name, guardianId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Family name is required.' });
  }

  const famId = 'fam_' + Date.now().toString(36);
  const primaryGuardianId = user?.userId || guardianId || 'guardian_' + Date.now().toString(36);

  const family: Family = {
    id: famId,
    name: name.trim(),
    primaryGuardianId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  dataStore.families.set(famId, family);

  // Link guardian in family_members
  const memberId = 'fmem_' + Date.now().toString(36);
  dataStore.familyMembers.set(memberId, {
    id: memberId,
    familyId: famId,
    userId: primaryGuardianId,
    role: 'guardian',
    createdAt: Date.now(),
  });

  dataStore.logAudit({
    category: 'auth',
    action: 'FAMILY_ACCOUNT_CREATED',
    details: { familyId: famId, name: family.name, primaryGuardianId },
  });

  return res.json({
    success: true,
    message: 'Family account created successfully.',
    family,
  });
});

// POST /api/family/add-student
// Zero-PII student profile creation within family
router.post('/family/add-student', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const {
    familyId,
    fullName,
    classGrade,
    pin,
    securityQuestionId,
    securityQuestion,
    securityAnswer,
    avatarEmoji,
    avatarColor,
  } = req.body;

  if (!familyId || !fullName || !classGrade) {
    return res.status(400).json({ error: 'Family ID, student full name, and class grade are required.' });
  }

  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  // Authorization check
  if (user) {
    if (user.role === 'student') {
      return res.status(403).json({ error: 'Students cannot add student profiles to a family.' });
    }
    if (user.role === 'guardian') {
      const isFamilyGuardian =
        family.primaryGuardianId === user.userId ||
        Array.from(dataStore.familyMembers.values()).some(
          (m) => m.familyId === familyId && m.userId === user.userId && m.role === 'guardian'
        );
      if (!isFamilyGuardian) {
        return res.status(403).json({ error: 'Access denied. You are not a guardian of this family.' });
      }
    }
  }

  const cleanName = String(fullName).trim();
  const grade = parseInt(classGrade, 10) || 10;
  const studentId = 'user_student_' + Date.now().toString(36);
  const cleanPin = pin && String(pin).trim().length === 4 ? String(pin).trim() : '1234';

  // Generate zero-PII student code: e.g. RAVI-10
  const prefix = cleanName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'STD';
  const loginCode = `${prefix}-${grade}`;

  const pwd = dataStore.hashPassword(cleanPin);

  const newStudent: User & { passwordHash: string; salt: string } = {
    id: studentId,
    fullName: cleanName,
    email: `${studentId}@student.local`,
    role: 'student',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
    studentProfile: {
      userId: studentId,
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_maths',
      programmeId: 'CLASS-10',
      semester: 1,
      admissionYear: '2026',
      rollNumber: loginCode,
      attendancePercent: 100,
      completedTopicIds: [],
    },
  };

  dataStore.users.set(studentId, newStudent);

  // Link to family members
  const memberId = 'fmem_' + Date.now().toString(36);
  dataStore.familyMembers.set(memberId, {
    id: memberId,
    familyId,
    userId: studentId,
    role: 'student',
    createdAt: Date.now(),
  });

  // Link guardianship
  const guardId = 'guard_' + Date.now().toString(36);
  dataStore.guardianships.set(guardId, {
    id: guardId,
    guardianId: family.primaryGuardianId,
    studentId,
    relationship: 'parent',
    createdAt: Date.now(),
  });

  dataStore.logAudit({
    category: 'auth',
    action: 'FAMILY_STUDENT_REGISTERED',
    details: { familyId, studentId, loginCode, classGrade: grade },
  });

  return res.json({
    success: true,
    message: 'Student profile added to family successfully.',
    student: {
      id: studentId,
      fullName: cleanName,
      loginCode,
      classGrade: grade,
      avatarEmoji: avatarEmoji || '👦',
      avatarColor: avatarColor || '#0F766E',
      securityQuestionId: securityQuestionId || 'subject',
      securityQuestion: securityQuestion || 'What is your favorite school subject?',
      createdAt: newStudent.createdAt,
    },
  });
});

// POST /api/family/link-student
router.post('/family/link-student', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const { familyId, studentCode } = req.body;
  if (!familyId || !studentCode) {
    return res.status(400).json({ error: 'Family ID and Student Code are required.' });
  }

  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  // Authorization check
  if (user) {
    if (user.role === 'student') {
      return res.status(403).json({ error: 'Students cannot link sibling accounts.' });
    }
    if (user.role === 'guardian') {
      const isFamilyGuardian =
        family.primaryGuardianId === user.userId ||
        Array.from(dataStore.familyMembers.values()).some(
          (m) => m.familyId === familyId && m.userId === user.userId && m.role === 'guardian'
        );
      if (!isFamilyGuardian) {
        return res.status(403).json({ error: 'Access denied. You are not a guardian of this family.' });
      }
    }
  }

  // Find student by loginCode / rollNumber
  const code = String(studentCode).trim().toUpperCase();
  let matchedStudent: User | null = null;
  for (const u of dataStore.users.values()) {
    if (
      u.role === 'student' &&
      (u.studentProfile?.rollNumber?.toUpperCase() === code || u.id === studentCode)
    ) {
      matchedStudent = u;
      break;
    }
  }

  if (!matchedStudent) {
    return res.status(404).json({ error: 'Student with this code not found.' });
  }

  // Check if already linked
  const isAlreadyMember = Array.from(dataStore.familyMembers.values()).some(
    (m) => m.familyId === familyId && m.userId === matchedStudent!.id
  );

  if (!isAlreadyMember) {
    const memberId = 'fmem_' + Date.now().toString(36);
    dataStore.familyMembers.set(memberId, {
      id: memberId,
      familyId,
      userId: matchedStudent.id,
      role: 'student',
      createdAt: Date.now(),
    });

    const guardId = 'guard_' + Date.now().toString(36);
    dataStore.guardianships.set(guardId, {
      id: guardId,
      guardianId: family.primaryGuardianId,
      studentId: matchedStudent.id,
      relationship: 'parent',
      createdAt: Date.now(),
    });
  }

  return res.json({
    success: true,
    message: 'Student linked to family successfully.',
    student: {
      id: matchedStudent.id,
      fullName: matchedStudent.fullName,
      rollNumber: matchedStudent.studentProfile?.rollNumber,
    },
  });
});

// GET /api/family/:familyId/children
router.get('/family/:familyId/children', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  // Enforce that guardians can only view their own family's children
  if (user) {
    if (user.role === 'guardian') {
      const isFamilyGuardian =
        family.primaryGuardianId === user.userId ||
        Array.from(dataStore.familyMembers.values()).some(
          (m) => m.familyId === familyId && m.userId === user.userId && m.role === 'guardian'
        );
      if (!isFamilyGuardian) {
        return res.status(403).json({ error: 'Access denied. Guardians can only view their own family children.' });
      }
    } else if (user.role === 'student') {
      const isMember = Array.from(dataStore.familyMembers.values()).some(
        (m) => m.familyId === familyId && m.userId === user.userId
      );
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied. You can only view your own family profile.' });
      }
    }
  }

  // Get student members
  const memberStudentIds = Array.from(dataStore.familyMembers.values())
    .filter((m) => m.familyId === familyId && m.role === 'student')
    .map((m) => m.userId);

  const children = memberStudentIds
    .map((id) => dataStore.users.get(id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({
      id: u.id,
      fullName: u.fullName,
      loginCode: u.studentProfile?.rollNumber || u.id,
      classGrade: 10,
      completedTopicsCount: u.studentProfile?.completedTopicIds?.length || 0,
      attendancePercent: u.studentProfile?.attendancePercent || 100,
    }));

  return res.json({
    success: true,
    family: { id: family.id, name: family.name },
    children,
  });
});

// GET /api/family/children/:id
router.get('/family/children/:id', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetUser = dataStore.users.get(studentId);
  if (!targetUser || targetUser.role !== 'student') {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  if (user) {
    if (user.role === 'student' && user.userId !== studentId) {
      return res.status(403).json({ error: 'Access denied. Students can only view their own progress.' });
    }
    if (user.role === 'guardian') {
      const hasGuardianship =
        Array.from(dataStore.guardianships.values()).some(
          (g) => g.guardianId === user.userId && g.studentId === studentId
        ) ||
        Array.from(dataStore.familyMembers.values()).some(
          (m) =>
            m.userId === user.userId &&
            m.role === 'guardian' &&
            Array.from(dataStore.familyMembers.values()).some(
              (sm) => sm.familyId === m.familyId && sm.userId === studentId && sm.role === 'student'
            )
        );
      if (!hasGuardianship) {
        return res.status(403).json({ error: 'Access denied. You are not a guardian of this student.' });
      }
    }
  }

  return res.json({
    success: true,
    child: {
      id: targetUser.id,
      fullName: targetUser.fullName,
      loginCode: targetUser.studentProfile?.rollNumber || targetUser.id,
      completedTopicIds: targetUser.studentProfile?.completedTopicIds || [],
      attendancePercent: targetUser.studentProfile?.attendancePercent || 100,
      createdAt: targetUser.createdAt,
    },
  });
});

// ============================================================================
// 9. COURSES & ACADEMIC MANAGEMENT (L2 Institution Admin Direct Control)
// ============================================================================

// POST /api/courses
router.post('/courses', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  if (user) {
    if (!['super_admin', 'institution_admin', 'teacher'].includes(user.role)) {
      return res.status(403).json({
        error: `Access denied. Role "${user.role}" does not have permission to create courses.`,
      });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required to create courses.' });
  }

  const { code, title, institutionId, description, syllabus } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: 'Course code and title are required.' });
  }

  const courseId = 'course_' + Date.now().toString(36);
  const newCourse: Course = {
    id: courseId,
    code: String(code).trim().toUpperCase(),
    title: String(title).trim(),
    institutionId: institutionId || 'inst_ait_hyd',
    description: description || '',
    syllabus: syllabus || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  dataStore.courses.set(courseId, newCourse);

  dataStore.logAudit({
    category: 'academic',
    action: 'COURSE_CREATED',
    details: { courseId, code: newCourse.code, title: newCourse.title },
  });

  return res.json({
    success: true,
    message: 'Course created successfully under Institutional Administration.',
    course: newCourse,
  });
});

// GET /api/courses
router.get('/courses', (req: Request, res: Response) => {
  const courseList = Array.from(dataStore.courses.values()).sort((a, b) => b.createdAt - a.createdAt);
  return res.json({ success: true, courses: courseList });
});

// GET /api/courses/:id
router.get('/courses/:id', (req: Request, res: Response) => {
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }
  return res.json({ success: true, course });
});

// POST /api/courses/:id/enroll
router.post('/courses/:id/enroll', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  if (user) {
    if (user.role === 'student' && user.userId !== studentId) {
      return res.status(403).json({ error: 'Students can only enroll themselves.' });
    }
  }

  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const enrollmentId = 'enr_' + Date.now().toString(36);
  const enrollment: CourseEnrollment = {
    id: enrollmentId,
    courseId,
    studentId,
    status: 'active',
    enrolledAt: Date.now(),
  };

  dataStore.courseEnrollments.set(enrollmentId, enrollment);

  return res.json({
    success: true,
    message: 'Student enrolled in course successfully.',
    enrollment,
  });
});

// ============================================================================
// 10. AI TUTOR CONVERSATION HISTORY & RAG PERSISTENCE
// ============================================================================

// POST /api/tutor/conversations
router.post('/tutor/conversations', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const { studentId, topicId, language, message } = req.body;
  if (!studentId || !message || !message.text) {
    return res.status(400).json({ error: 'Student ID and message text are required.' });
  }

  if (user && user.role === 'student' && user.userId !== studentId) {
    return res.status(403).json({ error: 'Access denied. Students can only update their own tutor conversations.' });
  }

  // Find or create conversation
  let conv: AiConversation | undefined;
  for (const c of dataStore.aiConversations.values()) {
    if (c.studentId === studentId && (!topicId || c.topicId === topicId)) {
      conv = c;
      break;
    }
  }

  if (!conv) {
    const convId = 'conv_' + Date.now().toString(36);
    conv = {
      id: convId,
      studentId,
      topicId: topicId || 'ch1_real_numbers',
      language: language || 'te',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dataStore.aiConversations.set(convId, conv);
  } else {
    conv.updatedAt = Date.now();
  }

  const msgId = 'msg_' + Date.now().toString(36);
  const newMsg: AiMessage = {
    id: msgId,
    conversationId: conv.id,
    sender: message.sender || 'student',
    text: message.text,
    audioUrl: message.audioUrl,
    photoUrl: message.photoUrl,
    createdAt: Date.now(),
  };

  dataStore.aiMessages.set(msgId, newMsg);

  return res.json({
    success: true,
    conversationId: conv.id,
    messageId: newMsg.id,
    message: newMsg,
  });
});

// GET /api/tutor/conversations/:studentId
router.get('/tutor/conversations/:studentId', (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;

  if (user) {
    if (user.role === 'student' && user.userId !== studentId) {
      return res.status(403).json({ error: 'Access denied. Students can only view their own tutor conversations.' });
    }
    if (user.role === 'guardian') {
      const hasGuardianship =
        Array.from(dataStore.guardianships.values()).some(
          (g) => g.guardianId === user.userId && g.studentId === studentId
        ) ||
        Array.from(dataStore.familyMembers.values()).some(
          (m) =>
            m.userId === user.userId &&
            m.role === 'guardian' &&
            Array.from(dataStore.familyMembers.values()).some(
              (sm) => sm.familyId === m.familyId && sm.userId === studentId
            )
        );
      if (!hasGuardianship) {
        return res.status(403).json({ error: 'Access denied. You are not a guardian of this student.' });
      }
    }
  }

  const convList = Array.from(dataStore.aiConversations.values())
    .filter((c) => c.studentId === studentId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const result = convList.map((c) => {
    const msgs = Array.from(dataStore.aiMessages.values())
      .filter((m) => m.conversationId === c.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    return { ...c, messages: msgs };
  });

  return res.json({
    success: true,
    conversations: result,
  });
});

export { router as enterpriseApiRouter };
