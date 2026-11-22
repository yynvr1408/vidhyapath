// Comprehensive Enterprise Educational Platform API Router
import '../env.js';
import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { dataStore } from '../db/store.js';
import { AuthService, requireAuth, requireRole, AuthenticatedRequest, TokenPayload } from '../services/auth.js';
import { EmailService } from '../services/email.js';
import { AiGuardrailService } from '../services/aiGuardrails.js';
import { SyllabusProcessorService } from '../services/syllabusProcessor.js';
import { askGroqTutor } from '../services/groq.js';
import { uploadToR2 } from '../services/r2Storage.js';
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
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Announcement,
} from '../types/enterprise.js';

const router = Router();

// ============================================================================
// 1. AUTHENTICATION & ACCOUNT MANAGEMENT
// ============================================================================

// POST /api/auth/login (Unified Role-Based Login: Email/Password for Staff/Parents & RollNo/PIN for Students)
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, loginCode, rollNumber, pin } = req.body;
  const rawIdentifier = loginCode || rollNumber || email;
  const rawCredential = pin || password;

  if (!rawIdentifier || !rawCredential) {
    return res.status(400).json({ error: 'Username/Email/Roll Number and Password/PIN are required.' });
  }

  const normalizedIdentifier = String(rawIdentifier).trim().toLowerCase();

  // Check account lockout
  const lockout = AuthService.checkAccountLockout(normalizedIdentifier);
  if (lockout.locked) {
    return res.status(429).json({
      error: `Account temporarily locked due to multiple failed login attempts. Please wait ${lockout.waitSeconds}s before trying again.`,
    });
  }

  // Find user by Email, Roll Number / Login Code, or User ID
  let matchedUser: (User & { passwordHash: string; salt: string }) | null = null;
  for (const user of dataStore.users.values()) {
    if (
      user.email.toLowerCase() === normalizedIdentifier ||
      user.id.toLowerCase() === normalizedIdentifier ||
      (user.studentProfile?.rollNumber && user.studentProfile.rollNumber.toLowerCase() === normalizedIdentifier)
    ) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    AuthService.recordLoginFailure(normalizedIdentifier);
    return res.status(401).json({ error: 'Invalid credentials. User profile not found.' });
  }

  // Verify password or PIN
  const isValid = dataStore.verifyPassword(String(rawCredential), matchedUser.passwordHash, matchedUser.salt);
  if (!isValid) {
    AuthService.recordLoginFailure(normalizedIdentifier);
    return res.status(401).json({ error: 'Invalid password or PIN.' });
  }

  // Check user status
  if (matchedUser.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact your administrator.' });
  }
  if (matchedUser.status === 'pending_verification') {
    return res.status(403).json({ error: 'Your account is pending verification. Please verify your OTP.' });
  }

  // Success
  AuthService.recordLoginSuccess(normalizedIdentifier);
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
    redirectTo: dashboardRoutes[matchedUser.role] || '/learn',
  });
});

// POST /api/auth/register/guardian (Parent/Guardian Family Account Registration)
router.post('/auth/register/guardian', async (req: Request, res: Response) => {
  const { fullName, email, password, phone } = req.body;
  if (!fullName || !email || !password || String(password).length < 12) {
    return res.status(400).json({ error: 'Full name, email, and a password of at least 12 characters are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail.includes('@')) return res.status(400).json({ error: 'A valid email address is required.' });
  for (const u of dataStore.users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  }
  if (!AuthService.consumeVerifiedOtp(normalizedEmail, 'registration')) {
    return res.status(403).json({ error: 'Verify this email address before creating a guardian account.' });
  }

  const guardianId = 'user_guard_' + crypto.randomUUID();
  const pwd = dataStore.hashPassword(String(password));
  const newGuardian: User & { passwordHash: string; salt: string } = {
    id: guardianId,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : undefined,
    role: 'guardian',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
  };

  dataStore.users.set(guardianId, newGuardian);

  // Auto-provision primary family account
  const famId = 'fam_' + crypto.randomUUID();
  const family: Family = {
    id: famId,
    name: `${newGuardian.fullName}'s Family`,
    primaryGuardianId: guardianId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dataStore.families.set(famId, family);

  const memberId = 'fmem_' + Date.now().toString(36);
  dataStore.familyMembers.set(memberId, {
    id: memberId,
    familyId: famId,
    userId: guardianId,
    role: 'guardian',
    createdAt: Date.now(),
  });

  const token = AuthService.generateToken(newGuardian);

  dataStore.logAudit({
    userId: guardianId,
    userEmail: newGuardian.email,
    category: 'auth',
    action: 'GUARDIAN_ACCOUNT_REGISTERED',
    details: { familyId: famId, fullName: newGuardian.fullName },
  });

  return res.json({
    success: true,
    message: 'Parent/Guardian account created successfully.',
    token,
    user: {
      id: newGuardian.id,
      fullName: newGuardian.fullName,
      email: newGuardian.email,
      role: newGuardian.role,
      status: newGuardian.status,
    },
    family,
  });
});

// Teacher accounts are provisioned by an authenticated institution administrator.
router.post('/auth/register/teacher', (_req: Request, res: Response) => {
  return res.status(403).json({ error: 'Teacher accounts are invitation-only. Ask your institution administrator for an invitation.' });
});

// POST /api/auth/student/safety-question (Query student security question for PIN recovery)
router.post('/auth/student/safety-question', (req: Request, res: Response) => {
  const { loginCode, rollNumber } = req.body;
  const rawCode = String(loginCode || rollNumber || '').trim().toUpperCase();
  if (!rawCode) {
    return res.status(400).json({ error: 'Student login code or roll number is required.' });
  }

  let matchedStudent: User | null = null;
  for (const u of dataStore.users.values()) {
    if (
      u.role === 'student' &&
      (u.studentProfile?.rollNumber?.toUpperCase() === rawCode || u.id.toUpperCase() === rawCode)
    ) {
      matchedStudent = u;
      break;
    }
  }

  if (!matchedStudent) {
    return res.status(404).json({ error: 'Student account not found.' });
  }

  return res.json({
    success: true,
    securityQuestionId: matchedStudent.studentProfile?.securityQuestionId,
    securityQuestion: matchedStudent.studentProfile?.securityQuestion,
  });
});

// POST /api/auth/student/reset-pin (Zero-PII Student PIN Reset via Security Answer)
router.post('/auth/student/reset-pin', (req: Request, res: Response) => {
  const { loginCode, rollNumber, securityAnswer, newPin } = req.body;
  const rawCode = String(loginCode || rollNumber || '').trim().toUpperCase();
  if (!rawCode || !securityAnswer || !newPin) {
    return res.status(400).json({ error: 'Login code, security answer, and new 4-digit PIN are required.' });
  }

  const cleanPin = String(newPin).trim();
  if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  let matchedStudent: (User & { passwordHash: string; salt: string }) | null = null;
  for (const u of dataStore.users.values()) {
    if (
      u.role === 'student' &&
      (u.studentProfile?.rollNumber?.toUpperCase() === rawCode || u.id.toUpperCase() === rawCode)
    ) {
      matchedStudent = u;
      break;
    }
  }

  if (!matchedStudent) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Verify answer (case-insensitive + regional synonyms)
  const inputAnswer = String(securityAnswer).trim().toLowerCase();
  const acceptedMath = ['maths', 'math', 'mathematics', 'లెక్కలు', 'గణితం', 'गणित'];
  const storedAnswer = matchedStudent.studentProfile?.securityAnswerHash || '';
  const inputHash = crypto.createHash('sha256').update(inputAnswer).digest('hex');
  const storedIsHash = /^[a-f0-9]{64}$/i.test(storedAnswer);
  const isMatch = storedIsHash
    ? crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedAnswer, 'hex'))
    : Boolean(storedAnswer) && (inputAnswer === storedAnswer.toLowerCase() || (storedAnswer.toLowerCase().includes('math') && acceptedMath.includes(inputAnswer)));

  if (!isMatch) {
    return res.status(400).json({ error: 'Incorrect security answer. Please try again.' });
  }

  // Update student PIN hash
  const pwd = dataStore.hashPassword(cleanPin);
  matchedStudent.passwordHash = pwd.hash;
  matchedStudent.salt = pwd.salt;
  matchedStudent.studentProfile!.securityAnswerHash = inputHash;
  dataStore.users.set(matchedStudent.id, matchedStudent);

  dataStore.logAudit({
    userId: matchedStudent.id,
    category: 'auth',
    action: 'STUDENT_PIN_RESET_SUCCESS',
    details: { rollNumber: rawCode },
  });

  return res.json({
    success: true,
    message: 'PIN successfully updated! You can now log in with your new 4-digit PIN.',
  });
});

// POST /api/auth/otp/send
router.post('/auth/otp/send', async (req: Request, res: Response) => {
  const { email, purpose = 'registration' } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!['registration', 'login', 'password_reset', 'email_verification'].includes(String(purpose))) {
    return res.status(400).json({ error: 'Unsupported verification purpose.' });
  }

  const isEmailConfigured = EmailService.isConfigured('verification');
  if (!isEmailConfigured && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again later.' });
  }

  const { otp, error } = AuthService.generateOtp(email, purpose);
  if (error) {
    return res.status(429).json({ error });
  }

  // Dispatch via EmailJS / simulated mailer
  await EmailService.sendOtpEmail(email, otp, purpose);

  return res.json({
    success: true,
    message: isEmailConfigured
      ? `A 6-digit verification code has been dispatched to ${email}.`
      : 'Development mode: email delivery is not configured.',
    cooldownSeconds: 60,
    ...(!isEmailConfigured && process.env.NODE_ENV !== 'production' ? { simulated: true, devOtp: otp } : {}),
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

  const isEmailConfigured = EmailService.isConfigured('password_reset');
  if (!isEmailConfigured && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Password reset is temporarily unavailable. Please try again later.' });
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

  return res.json({
    success: true,
    message: isEmailConfigured
      ? `A password reset code has been dispatched to ${normalizedEmail}.`
      : 'Development mode: email delivery is not configured.',
    cooldownSeconds: 60,
    ...(!isEmailConfigured && process.env.NODE_ENV !== 'production' ? { simulated: true, devOtp: otp } : {}),
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

  if (!name || !code || !contactEmail || !adminPassword || String(adminPassword).length < 12) {
    return res.status(400).json({ error: 'Institution name, code, contact email, and an administrator password of at least 12 characters are required.' });
  }

  const normalizedEmail = String(contactEmail).trim().toLowerCase();
  if (!normalizedEmail.includes('@')) return res.status(400).json({ error: 'A valid institution email is required.' });
  if (!AuthService.consumeVerifiedOtp(normalizedEmail, 'registration')) {
    return res.status(403).json({ error: 'Verify this email address before submitting the institution request.' });
  }
  if (Array.from(dataStore.users.values()).some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }
  const normalizedCode = String(code).trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (normalizedCode.length < 3) return res.status(400).json({ error: 'Institution code must contain at least 3 letters or numbers.' });
  const allowedTypes = ['university', 'college', 'school', 'polytechnic'];
  const institutionType = allowedTypes.includes(type) ? type : 'school';

  const instId = 'inst_' + normalizedCode.toLowerCase() + '_' + Date.now().toString(36);

  const newInst: Institution = {
    id: instId,
    name,
    code: normalizedCode,
    type: institutionType,
    address: address || '',
    contactEmail: normalizedEmail,
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
    email: normalizedEmail,
    phone: contactPhone,
    role: 'institution_admin',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
  };

  dataStore.users.set(adminUserId, adminUser);

  // Only send an operational notification when a configured platform admin exists.
  for (const superAdmin of dataStore.users.values()) {
    if (superAdmin.role === 'super_admin') {
      const notifId = 'notif_' + crypto.randomUUID();
      dataStore.notifications.set(notifId, {
        id: notifId,
        userId: superAdmin.id,
        title: 'New institution registration',
        message: `${name} has submitted an onboarding request.`,
        type: 'security',
        read: false,
        actionUrl: '/portal/institutions',
        createdAt: Date.now(),
      });
    }
  }

  dataStore.logAudit({
    userId: adminUserId,
    institutionId: instId,
    category: 'admin',
    action: 'INSTITUTION_REGISTRATION_SUBMITTED',
    details: { name, code: normalizedCode, contactEmail: normalizedEmail },
  });

  return res.json({
    success: true,
    message: 'Institution registration submitted successfully. Your request has been forwarded to the Platform Super Administrator for verification and approval.',
    institutionId: instId,
  });
});

// POST /api/auth/register/student (supports both Institutional and Independent Home Learners)
router.post(['/auth/register/student', '/api/auth/register/student'], async (req: Request, res: Response) => {
  const {
    fullName,
    email,
    password,
    pin,
    institutionId,
    departmentId,
    programmeId,
    admissionYear,
    semester,
    classGrade,
    board,
    state,
    isIndependent,
    securityQuestionId,
    securityQuestion,
    securityAnswer,
  } = req.body;

  const cleanName = String(fullName || '').trim();
  if (!cleanName) {
    return res.status(400).json({ error: 'Student full name is required.' });
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCredential = String(pin || password || '');
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!/^\d{4}$/.test(cleanCredential) && cleanCredential.length < 8) {
    return res.status(400).json({ error: 'Use a four-digit PIN or a password of at least 8 characters.' });
  }
  if (isIndependent === false || institutionId) {
    return res.status(403).json({ error: 'Independent student registration is available here. Ask an institution administrator to provision institutional student accounts.' });
  }
  if (!securityAnswer || !String(securityAnswer).trim()) {
    return res.status(400).json({ error: 'A security answer is required for student PIN recovery.' });
  }

  const grade = parseInt(classGrade || semester || '10', 10) || 10;
  const studentId = 'user_student_' + crypto.randomUUID();

  for (const u of dataStore.users.values()) {
    if (u.email.toLowerCase() === cleanEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  }

  if (!AuthService.consumeVerifiedOtp(cleanEmail, 'registration')) {
    return res.status(403).json({ error: 'Verify this email address before creating a student account.' });
  }

  // Resolve institution: if independent home learner, bind to global platform institution
  const effectiveInstId = 'inst_global';
  const inst = dataStore.institutions.get(effectiveInstId);
  if (!inst) {
    return res.status(503).json({ error: 'Independent learning enrollment is temporarily unavailable.' });
  }
  const instName = inst.name;

  let finalRollNumber = '';
  do {
    finalRollNumber = `VP-${grade}-${crypto.randomInt(100000, 1000000)}`;
  } while (Array.from(dataStore.users.values()).some((user) => user.studentProfile?.rollNumber === finalRollNumber));

  const pwd = dataStore.hashPassword(cleanCredential);
  const securityAnswerHash = crypto.createHash('sha256').update(String(securityAnswer || '').trim().toLowerCase()).digest('hex');

  const newStudent: User & { passwordHash: string; salt: string } = {
    id: studentId,
    institutionId: effectiveInstId,
    institutionName: instName,
    fullName: cleanName,
    email: cleanEmail,
    role: 'student',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
    studentProfile: {
      userId: studentId,
      institutionId: effectiveInstId,
      departmentId: departmentId || 'independent',
      programmeId: programmeId || `CLASS-${grade}`,
      admissionYear: admissionYear || String(new Date().getFullYear()),
      semester: grade <= 10 ? 1 : (parseInt(semester, 10) || 1),
      classGrade: grade,
      board: board || (state ? `${state} SSC` : 'CBSE'),
      state: state || 'Andhra Pradesh',
      isIndependent: true,
      securityQuestionId: securityQuestionId || 'subject',
      securityQuestion: securityQuestion || 'What is your favorite school subject?',
      securityAnswerHash,
      rollNumber: finalRollNumber,
      guardianEmail: undefined,
      completedTopicIds: [],
    },
  };

  dataStore.users.set(studentId, newStudent);

  const token = AuthService.generateToken(newStudent);

  dataStore.logAudit({
    userId: studentId,
    userEmail: newStudent.email,
    institutionId: effectiveInstId,
    category: 'auth',
    action: 'STUDENT_REGISTERED_SUCCESS',
    details: { classGrade: grade, rollNumber: finalRollNumber, isIndependent: true },
  });

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

// GET /api/super-admin/users
router.get(
  '/super-admin/users',
  requireAuth,
  requireRole(['super_admin', 'institution_admin', 'academic_admin']),
  requireInstitutionScope((req) => (req as AuthenticatedRequest).user?.institutionId),
  (req: AuthenticatedRequest, res: Response) => {
  const institutionId = req.user!.role === 'super_admin' ? undefined : req.user!.institutionId;
  const users = Array.from(dataStore.users.values())
    .filter((u) => !institutionId || u.institutionId === institutionId)
    .map((u) => {
      const { passwordHash: _passwordHash, salt: _salt, ...safeUser } = u;
      return safeUser;
    });
  return res.json(users);
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
router.post('/institution/:id/invite-teacher', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), requireInstitutionScope((req) => req.params.id), async (req: AuthenticatedRequest, res: Response) => {
  const { email, fullName, departmentId, designation } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Teacher email and full name are required.' });
  }

  const instId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const inst = dataStore.institutions.get(instId);
  if (!inst) return res.status(404).json({ error: 'Institution not found.' });
  const teacherEmail = String(email).trim().toLowerCase();
  if (!teacherEmail.includes('@')) return res.status(400).json({ error: 'A valid teacher email is required.' });
  if (Array.from(dataStore.users.values()).some((u) => u.email.toLowerCase() === teacherEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const teacherId = 'user_teacher_' + crypto.randomUUID();
  const initialPassword = crypto.randomBytes(18).toString('base64url');
  const pwd = dataStore.hashPassword(initialPassword);

  const newTeacher: User & { passwordHash: string; salt: string } = {
    id: teacherId,
    institutionId: inst.id,
    institutionName: inst.name,
    fullName,
    email: teacherEmail,
    role: 'teacher',
    status: 'active',
    passwordHash: pwd.hash,
    salt: pwd.salt,
    createdAt: Date.now(),
    teacherProfile: {
      userId: teacherId,
      institutionId: inst.id,
      departmentId: departmentId || '',
      designation: designation || 'Assistant Professor',
      qualifications: 'M.Tech / Ph.D',
      assignedSubjectIds: [],
    },
  };

  dataStore.users.set(teacherId, newTeacher);

  await EmailService.sendTeacherInviteEmail(newTeacher.email, fullName, inst.name, departmentId || 'Institution teaching team', initialPassword);

  return res.json({ success: true, message: `Invitation sent to ${email}`, teacherId });
});

// ============================================================================
// 4. INTELLIGENT STUDENT-BASED SYLLABUS & ACADEMIC MANAGEMENT
// ============================================================================

// GET /api/academic/student-syllabus
// Dynamically fetches the syllabus matching student's verified profile
router.get('/academic/student-syllabus', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dataStore.users.get(req.user!.userId);
  if (!user) return res.status(401).json({ error: 'Authenticated account not found.' });
  if (!user.studentProfile) {
    if (!['super_admin', 'institution_admin', 'academic_admin', 'teacher'].includes(user.role)) {
      return res.status(403).json({ error: 'This account cannot view another learner’s syllabus.' });
    }
    const institutionId = String(req.query.institutionId || req.user!.institutionId || '');
    const programmeId = String(req.query.programmeId || '');
    const semester = parseInt(String(req.query.semester || ''), 10);
    if (!institutionId || !programmeId || !Number.isFinite(semester)) {
      return res.status(400).json({ error: 'Institution, programme, and semester are required for staff syllabus lookup.' });
    }
    if (req.user!.role !== 'super_admin' && req.user!.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access is limited to your institution.' });
    }
    const institution = dataStore.institutions.get(institutionId);
    if (req.user!.role !== 'super_admin' && institution?.status !== 'approved') {
      return res.status(403).json({ error: 'The institution is not approved.' });
    }

    let subjects = Array.from(dataStore.subjects.values()).filter(
      (s) => s.institutionId === institutionId && s.programmeId === programmeId && s.semester === semester
    );
    if (user.role === 'teacher') subjects = subjects.filter((s) => s.assignedTeacherIds.includes(user.id));

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
router.post('/academic/syllabus/parse', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), requireInstitutionScope((req) => req.body?.institutionId || (req as AuthenticatedRequest).user?.institutionId), (req: Request, res: Response) => {
  const { text, institutionId, departmentId, programmeId, semester, syllabusVersion } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Syllabus content text is required for processing.' });
  }
  const activeUser = (req as AuthenticatedRequest).user!;
  const targetInstitutionId = String(institutionId || activeUser.institutionId || '');
  if (!targetInstitutionId) return res.status(400).json({ error: 'Institution ID is required for a platform administrator.' });

  const draft = SyllabusProcessorService.processSyllabusText(text, {
    institutionId: targetInstitutionId,
    departmentId: departmentId || '',
    programmeId: programmeId || '',
    semester: parseInt(semester, 10) || 1,
    syllabusVersion,
  });

  return res.json({ success: true, draft });
});

// POST /api/academic/syllabus/publish - Admin approves & publishes syllabus to active DB
router.post('/academic/syllabus/publish', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), requireInstitutionScope((req) => req.body?.institutionId || (req as AuthenticatedRequest).user?.institutionId), (req: AuthenticatedRequest, res: Response) => {
  const { draft, institutionId, departmentId } = req.body;
  if (!draft || !draft.subjectName || !draft.units) {
    return res.status(400).json({ error: 'Invalid syllabus draft format.' });
  }
  const targetInstitutionId = String(institutionId || req.user!.institutionId || '');
  if (!targetInstitutionId) return res.status(400).json({ error: 'Institution ID is required for a platform administrator.' });

  const newSubject = SyllabusProcessorService.publishSyllabus(
    targetInstitutionId,
    departmentId || '',
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
router.get('/lms/subjects/:subjectId/overview', requireAuth, requireInstitutionScope((req) => {
  const subjectId = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  return dataStore.subjects.get(subjectId)?.institutionId;
}), (req: AuthenticatedRequest, res: Response) => {
  const subjectId = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  const subject = dataStore.subjects.get(subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });

  const user = dataStore.users.get(req.user!.userId);
  if (!user) return res.status(401).json({ error: 'Authenticated account not found.' });
  if (user.role === 'student' && (!user.studentProfile || user.studentProfile.institutionId !== subject.institutionId || user.studentProfile.programmeId !== subject.programmeId || user.studentProfile.semester !== subject.semester)) {
    return res.status(403).json({ error: 'This subject is not part of your enrolled programme.' });
  }
  if (user.role === 'teacher' && !subject.assignedTeacherIds.includes(user.id)) {
    return res.status(403).json({ error: 'This subject is not assigned to your teaching account.' });
  }

  const resources = Array.from(dataStore.learningResources.values()).filter((r) => r.subjectId === subject.id);
  const assignments = Array.from(dataStore.assignments.values()).filter((a) => a.subjectId === subject.id);
  const quizzes = Array.from(dataStore.quizzes.values())
    .filter((q) => q.subjectId === subject.id)
    .map((quiz) => user.role === 'student'
      ? { ...quiz, questions: quiz.questions.map(({ correctOptionIndex: _answer, explanation: _explanation, ...question }) => question) }
      : quiz);

  return res.json({
    subject,
    resources,
    assignments,
    quizzes,
  });
});

// POST /api/lms/subjects/:subjectId/resources
router.post('/lms/subjects/:subjectId/resources', requireAuth, requireRole(['teacher', 'academic_admin', 'institution_admin', 'super_admin']), requireInstitutionScope((req) => {
  const subjectId = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  return dataStore.subjects.get(subjectId)?.institutionId;
}), (req: AuthenticatedRequest, res: Response) => {
  const { unitId, topicId, resourceType, title, description, contentText, fileUrl, videoUrl, meetingUrl, scheduledAt } = req.body;

  if (!title || !resourceType) {
    return res.status(400).json({ error: 'Title and resourceType are required.' });
  }

  const user = dataStore.users.get(req.user!.userId);
  const subject = dataStore.subjects.get(String(req.params.subjectId));
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });
  if (req.user!.role === 'teacher' && !subject.assignedTeacherIds.includes(req.user!.userId)) {
    return res.status(403).json({ error: 'This subject is not assigned to your teaching account.' });
  }

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

// ============================================================================
// PHASE 4: TEACHER LMS WORKFLOWS (ASSIGNMENTS, QUIZZES, GRADING & R2 UPLOADS)
// ============================================================================

// POST /api/lms/assignments
// Teachers create an assignment with instructions, due date, max marks, and optional Cloudflare R2 attachments
router.post(
  '/lms/assignments',
  requireAuth,
  requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']),
  requireInstitutionScope((req) => dataStore.subjects.get(String(req.body?.subjectId || ''))?.institutionId),
  (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const { subjectId, unitId, title, description, instructions, dueDate, maxMarks, fileUrl, teacherId, teacherName } = req.body;

  if (!title || !subjectId) {
    return res.status(400).json({ error: 'Title and subjectId (or courseId) are required.' });
  }

  const subject = dataStore.subjects.get(String(subjectId));
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });
  if (user.role === 'teacher' && !subject.assignedTeacherIds.includes(user.userId)) {
    return res.status(403).json({ error: 'This subject is not assigned to your teaching account.' });
  }

  const assignmentId = 'assign_' + Date.now().toString(36);
  const activeTeacherId = user.userId;
  const teacherUser = dataStore.users.get(activeTeacherId);

  const newAssignment: Assignment = {
    id: assignmentId,
    subjectId,
    unitId: unitId || 'unit_1',
    teacherId: activeTeacherId,
    teacherName: teacherUser?.fullName || 'Instructor',
    title: String(title).trim(),
    description: description || '',
    instructions: instructions || '',
    dueDate: Number(dueDate) || Date.now() + 7 * 86400000, // Default 7 days
    maxMarks: Number(maxMarks) || 100,
    submissionsCount: 0,
    createdAt: Date.now(),
  };

  dataStore.assignments.set(assignmentId, newAssignment);

  dataStore.logAudit({
    category: 'academic',
    action: 'ASSIGNMENT_CREATED',
    details: {
      assignmentId,
      subjectId,
      title: newAssignment.title,
      maxMarks: newAssignment.maxMarks,
      dueDate: newAssignment.dueDate,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Assignment created successfully by instructor.',
    assignment: newAssignment,
  });
});

// GET /api/lms/assignments
router.get('/lms/assignments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { subjectId } = req.query;
  let list = Array.from(dataStore.assignments.values());
  const user = dataStore.users.get(req.user!.userId);
  if (!user) return res.status(401).json({ error: 'Authenticated account not found.' });
  if (subjectId) {
    list = list.filter((a) => a.subjectId === subjectId);
  }
  list = list.filter((assignment) => {
    const subject = dataStore.subjects.get(assignment.subjectId);
    if (!subject) return false;
    if (user.role === 'super_admin') return true;
    if (!user.institutionId || subject.institutionId !== user.institutionId) return false;
    if (dataStore.institutions.get(subject.institutionId)?.status !== 'approved') return false;
    if (user.role === 'student') {
      return Boolean(user.studentProfile && user.studentProfile.programmeId === subject.programmeId && user.studentProfile.semester === subject.semester);
    }
    if (user.role === 'teacher') return subject.assignedTeacherIds.includes(user.id);
    return ['institution_admin', 'academic_admin'].includes(user.role) && dataStore.institutions.get(subject.institutionId)?.status === 'approved';
  });
  const result = list.map((a) => {
    const subs = Array.from(dataStore.submissions.values()).filter((s) => s.assignmentId === a.id);
    return { ...a, submissionsCount: subs.length };
  });
  return res.json(result);
});

// GET /api/lms/assignments/:id/submissions
// Teacher reviews student submissions for an assignment
router.get('/lms/assignments/:id/submissions', requireAuth, requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => {
  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  return assignment ? dataStore.subjects.get(assignment.subjectId)?.institutionId : undefined;
}), (req: AuthenticatedRequest, res: Response) => {
  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }
  const user = req.user!;
  const assignmentSubject = dataStore.subjects.get(assignment.subjectId);
  if (user.role === 'teacher' && !assignmentSubject?.assignedTeacherIds.includes(user.userId)) {
    return res.status(403).json({ error: 'This assignment is outside your teaching scope.' });
  }

  const list = Array.from(dataStore.submissions.values()).filter((s) => s.assignmentId === assignmentId);

  return res.json({
    success: true,
    assignmentId,
    assignmentTitle: assignment.title,
    count: list.length,
    submissions: list,
  });
});

// POST /api/lms/assignments/:id/grade
// Teacher grades an assignment submission with marks and qualitative feedback
router.post('/lms/assignments/:id/grade', requireAuth, requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => {
  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  return assignment ? dataStore.subjects.get(assignment.subjectId)?.institutionId : undefined;
}), (req: AuthenticatedRequest, res: Response) => {

  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { submissionId, marksObtained, feedback } = req.body;

  if (!submissionId || marksObtained === undefined) {
    return res.status(400).json({ error: 'submissionId and marksObtained are required.' });
  }

  const submission = dataStore.submissions.get(submissionId);
  if (!submission || submission.assignmentId !== assignmentId) {
    return res.status(404).json({ error: 'Submission not found for this assignment.' });
  }

  const assignment = dataStore.assignments.get(assignmentId);
  const user = req.user!;
  const assignmentSubject = assignment ? dataStore.subjects.get(assignment.subjectId) : undefined;
  if (user.role === 'teacher' && !assignmentSubject?.assignedTeacherIds.includes(user.userId)) {
    return res.status(403).json({ error: 'This assignment is outside your teaching scope.' });
  }
  const numericMarks = Number(marksObtained);
  if (!Number.isFinite(numericMarks) || numericMarks < 0) {
    return res.status(400).json({ error: 'Marks must be a non-negative number.' });
  }
  if (assignment && numericMarks > assignment.maxMarks) {
    return res.status(400).json({
      error: `Marks obtained (${numericMarks}) cannot exceed max marks (${assignment.maxMarks}).`,
    });
  }

  submission.marksObtained = numericMarks;
  submission.feedback = feedback || 'Graded by instructor.';
  submission.status = 'graded';
  submission.gradedAt = Date.now();

  // Create student notification
  const notifId = 'notif_' + Date.now().toString(36);
  dataStore.notifications.set(notifId, {
    id: notifId,
    userId: submission.studentId,
    title: `Assignment Graded: ${assignment?.title || 'Assignment'}`,
    message: `You received ${numericMarks}/${assignment?.maxMarks || 100} marks. Feedback: "${submission.feedback}"`,
    type: 'assignment',
    actionUrl: `/assignments/${assignmentId}`,
    read: false,
    createdAt: Date.now(),
  });

  dataStore.logAudit({
    category: 'academic',
    action: 'SUBMISSION_GRADED',
    details: {
      assignmentId,
      submissionId,
      studentId: submission.studentId,
      marksObtained: numericMarks,
    },
  });

  return res.json({
    success: true,
    message: 'Submission graded successfully with marks and feedback.',
    submission,
  });
});

// POST /api/lms/quizzes
// Teachers author quizzes with distractor mistake tags for AI Socratic remediation
router.post('/lms/quizzes', requireAuth, requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => dataStore.subjects.get(String(req.body?.subjectId || ''))?.institutionId), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const { subjectId, unitId, title, timeLimitMinutes, passPercentage, questions, teacherId } = req.body;

  if (!title || !subjectId || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Title, subjectId, and at least one question are required.' });
  }
  const subject = dataStore.subjects.get(String(subjectId));
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });
  if (user.role === 'teacher' && !subject.assignedTeacherIds.includes(user.userId)) {
    return res.status(403).json({ error: 'This subject is not assigned to your teaching account.' });
  }

  const quizId = 'quiz_' + Date.now().toString(36);
  const activeTeacherId = user.userId;

  const formattedQuestions: QuizQuestion[] = questions.map((q: any, idx: number) => ({
    id: q.id || `q_${quizId}_${idx + 1}`,
    text: String(q.text || ''),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correctOptionIndex: Number(q.correctOptionIndex) || 0,
    explanation: q.explanation || '',
  }));

  const newQuiz: Quiz = {
    id: quizId,
    subjectId,
    unitId: unitId || 'unit_1',
    teacherId: activeTeacherId,
    title: String(title).trim(),
    timeLimitMinutes: Number(timeLimitMinutes) || 15,
    passPercentage: Number(passPercentage) || 60,
    questions: formattedQuestions,
    createdAt: Date.now(),
  };

  dataStore.quizzes.set(quizId, newQuiz);

  dataStore.logAudit({
    category: 'academic',
    action: 'QUIZ_CREATED',
    details: {
      quizId,
      subjectId,
      title: newQuiz.title,
      questionCount: newQuiz.questions.length,
      passPercentage: newQuiz.passPercentage,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Quiz created successfully by instructor.',
    quiz: newQuiz,
  });
});

// GET /api/lms/quizzes/:id/attempts
// Teacher reviews quiz attempts and student scores
router.get('/lms/quizzes/:id/attempts', requireAuth, requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => {
  const quizId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quiz = dataStore.quizzes.get(quizId);
  return quiz ? dataStore.subjects.get(quiz.subjectId)?.institutionId : undefined;
}), (req: AuthenticatedRequest, res: Response) => {
  const quizId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quiz = dataStore.quizzes.get(quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }
  if (req.user!.role === 'teacher' && !dataStore.subjects.get(quiz.subjectId)?.assignedTeacherIds.includes(req.user!.userId)) {
    return res.status(403).json({ error: 'This quiz is outside your teaching scope.' });
  }

  const list = Array.from(dataStore.quizAttempts.values()).filter((a) => a.quizId === quizId);

  return res.json({
    success: true,
    quizId,
    quizTitle: quiz.title,
    count: list.length,
    attempts: list,
  });
});

// POST /api/lms/upload
// Zero-disk Cloudflare R2 file upload for teaching materials, assignments & answer keys
router.post('/lms/upload', requireAuth, requireRole(['teacher', 'institution_admin', 'academic_admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { filename, contentType, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'filename and base64Data are required.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileUrl = await uploadToR2(buffer, safeName, contentType || 'application/pdf');

    return res.status(201).json({
      success: true,
      message: 'File uploaded to Cloudflare R2 successfully.',
      fileUrl,
      filename: safeName,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload file to Cloudflare R2: ' + err.message });
  }
});

// POST /api/lms/assignments/:id/submit
router.post('/lms/assignments/:id/submit', requireAuth, requireRole(['student']), requireInstitutionScope((req) => {
  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  return assignment ? dataStore.subjects.get(assignment.subjectId)?.institutionId : undefined;
}), (req: AuthenticatedRequest, res: Response) => {

  const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignment = dataStore.assignments.get(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const user = dataStore.users.get(req.user!.userId);
  const subject = dataStore.subjects.get(assignment.subjectId);
  if (!user?.studentProfile || !subject || user.studentProfile.programmeId !== subject.programmeId || user.studentProfile.semester !== subject.semester) {
    return res.status(403).json({ error: 'This assignment is not part of your enrolled programme.' });
  }

  const { contentText, fileUrl } = req.body;
  const targetStudentId = req.user!.userId;

  const subUser = dataStore.users.get(targetStudentId);
  const subId = 'sub_' + assignmentId + '_' + targetStudentId;
  const submission: AssignmentSubmission = {
    id: subId,
    assignmentId,
    studentId: targetStudentId,
    studentName: subUser?.fullName || 'Student',
    contentText: contentText || '',
    fileUrl,
    status: 'submitted',
    submittedAt: Date.now(),
  };

  dataStore.submissions.set(subId, submission);

  return res.json({ success: true, message: 'Assignment submitted successfully!', submission });
});

// POST /api/lms/quizzes/:id/attempt
router.post('/lms/quizzes/:id/attempt', requireAuth, requireRole(['student']), requireInstitutionScope((req) => {
  const quizId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quiz = dataStore.quizzes.get(quizId);
  return quiz ? dataStore.subjects.get(quiz.subjectId)?.institutionId : undefined;
}), (req: AuthenticatedRequest, res: Response) => {

  const quizId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quiz = dataStore.quizzes.get(quizId);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
  const user = dataStore.users.get(req.user!.userId);
  const subject = dataStore.subjects.get(quiz.subjectId);
  if (!user?.studentProfile || !subject || user.studentProfile.programmeId !== subject.programmeId || user.studentProfile.semester !== subject.semester) {
    return res.status(403).json({ error: 'This quiz is not part of your enrolled programme.' });
  }

  const { selectedAnswers = [] } = req.body;
  if (!Array.isArray(selectedAnswers)) return res.status(400).json({ error: 'Selected answers must be an array.' });
  const targetStudentId = req.user!.userId;

  const subUser = dataStore.users.get(targetStudentId);

  let score = 0;
  quiz.questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctOptionIndex) {
      score += 1;
    }
  });

  const percentage = Math.round((score / quiz.questions.length) * 100);
  const passed = percentage >= quiz.passPercentage;

  const attemptId = 'att_' + quiz.id + '_' + Date.now().toString(36);
  const attempt: QuizAttempt = {
    id: attemptId,
    quizId: quiz.id,
    studentId: targetStudentId,
    studentName: subUser?.fullName || 'Student',
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    selectedAnswers,
    completedAt: Date.now(),
  };

  dataStore.quizAttempts.set(attemptId, attempt);

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

// POST /api/tutor/chat (Context-Aware Socratic AI Tutor with Dynamic Grade, Board & Trilingual Delivery)
router.post('/tutor/chat', async (req: Request, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  if (!user && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required to consult AI tutor.' });
  }

  const { query, subjectId, unitTitle, topicTitle, classGrade, board, state, language, studentId } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query prompt is required.' });
  }

  const activeUserId = user?.userId || studentId || 'student_guest';
  const studentUser = dataStore.users.get(activeUserId);
  const profile = studentUser?.studentProfile;

  const effectiveGrade = Number(classGrade || profile?.classGrade || 10);
  const effectiveBoard = board || profile?.board || 'State SSC';
  const effectiveState = state || profile?.state || 'Andhra Pradesh';
  const effectiveLang = (language || 'te').toLowerCase() === 'hi' ? 'hi' : (language || 'te').toLowerCase() === 'en' ? 'en' : 'te';

  const subject = subjectId ? dataStore.subjects.get(subjectId) : null;
  const subjectName = subject ? subject.name : 'Mathematics';

  // 1. Enforce Application & Backend Guardrails
  const check = AiGuardrailService.inspectQuery(
    activeUserId,
    String(query),
    user?.institutionId,
    user?.role || 'student'
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
      language: effectiveLang,
    });
  }

  // 3. Build dynamic syllabus-grounded system prompt
  const systemPrompt = AiGuardrailService.buildPedagogicalSystemPrompt(
    subjectName,
    unitTitle,
    topicTitle,
    effectiveGrade,
    effectiveBoard,
    effectiveState,
    effectiveLang
  );

  try {
    const aiResponse = await askGroqTutor(query, systemPrompt);
    if (aiResponse) {
      return res.json({
        answer: aiResponse,
        flagged: false,
        groundedSubject: subjectName,
        classGrade: effectiveGrade,
        board: effectiveBoard,
        state: effectiveState,
        language: effectiveLang,
      });
    }
  } catch (err: any) {
    console.warn('[AI Tutor] Model call failed, using Socratic pedagogical fallback.');
  }

  // Socratic Fallback Localized to the 3 Core Teaching Languages
  const fallbackMessage =
    effectiveLang === 'te'
      ? `మనం ${subjectName} (తరగతి ${effectiveGrade}) లోని ఈ భావనను క్రమపద్ధతిలో అర్థం చేసుకుందాం. మీ ప్రశ్నకు సంబంధించిన మొదటి సూత్రం లేదా సిద్ధాంతం ఏమిటో మీరు చెప్పగలరా? ప్రయత్నించండి, నేను మీకు సమాధానం చేరుకోవడానికి మార్గదర్శనం చేస్తాను!`
      : effectiveLang === 'hi'
      ? `आइए हम ${subjectName} (कक्षा ${effectiveGrade}) की इस अवधारणा को चरण-दर-चरण समझें। क्या आप इस प्रश्न से संबंधित पहला सूत्र या प्रमेय बता सकते हैं? प्रयास करें, मैं आपको उत्तर तक पहुँचने में मार्गदर्शन करूँगा!`
      : `Let's break this concept down step-by-step for ${subjectName} (Class ${effectiveGrade}, ${effectiveBoard}). What is the primary definition or theorem relevant to your question? Try explaining your first thoughts, and I will guide you to the full solution!`;

  return res.json({
    answer: fallbackMessage,
    flagged: false,
    fallback: true,
    classGrade: effectiveGrade,
    board: effectiveBoard,
    state: effectiveState,
    language: effectiveLang,
  });
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
router.get('/announcements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dataStore.users.get(req.user!.userId);
  if (!user) return res.status(401).json({ error: 'Authenticated account not found.' });
  const annList = Array.from(dataStore.announcements.values())
    .filter((announcement) =>
      user.role === 'super_admin' ||
      (announcement.institutionId === user.institutionId &&
        (!announcement.targetRole ||
          announcement.targetRole === 'all' ||
          (announcement.targetRole === 'teachers' && user.role === 'teacher') ||
          (announcement.targetRole === 'students' && user.role === 'student')))
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  return res.json(annList);
});

// POST /api/announcements
router.post('/announcements', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin', 'teacher']), requireInstitutionScope((req) => req.body?.institutionId || (req as AuthenticatedRequest).user?.institutionId || 'inst_global'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, content, priority, targetAudience } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  const annId = 'ann_' + Date.now().toString(36);
  const ann: Announcement = {
    id: annId,
    institutionId: user.role === 'super_admin' ? String(req.body.institutionId || 'inst_global') : user.institutionId!,
    authorId: user.userId,
    authorName: user.fullName,
    authorRole: user.role,
    title: String(title),
    body: String(content),
    priority: priority === 'urgent' ? 'urgent' : 'normal',
    targetRole: (targetAudience === 'teachers' || targetAudience === 'students') ? targetAudience : 'all',
    createdAt: Date.now(),
  };
  dataStore.announcements.set(annId, ann);
  return res.json({ success: true, announcement: ann });
});

// Helper for optional or required caller authentication and ownership verification
function optionalOrRequiredAuth(req: Request): TokenPayload | null {
  if ((req as AuthenticatedRequest).user) return (req as AuthenticatedRequest).user!;
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

function requireInstitutionScope(getInstitutionId: (req: Request) => unknown) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const institutionId = String(getInstitutionId(req) || '').trim();
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (user.role === 'super_admin') return next();
    const institution = institutionId ? dataStore.institutions.get(institutionId) : null;
    if (!institution || institution.status !== 'approved' || user.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access is limited to your approved institution.' });
    }
    next();
  };
}

function isGuardianForFamily(user: TokenPayload, family: Family): boolean {
  return user.role === 'super_admin' || family.primaryGuardianId === user.userId ||
    Array.from(dataStore.familyMembers.values()).some(
      (member) => member.familyId === family.id && member.userId === user.userId && member.role === 'guardian'
    );
}

function guardianCanAccessStudent(user: TokenPayload, studentId: string): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'student') return user.userId === studentId;
  if (user.role !== 'guardian') return false;
  return Array.from(dataStore.guardianships.values()).some(
    (link) => link.guardianId === user.userId && link.studentId === studentId
  ) || Array.from(dataStore.familyMembers.values()).some((member) =>
    member.userId === user.userId && member.role === 'guardian' &&
    Array.from(dataStore.familyMembers.values()).some(
      (studentMember) => studentMember.familyId === member.familyId && studentMember.userId === studentId && studentMember.role === 'student'
    )
  );
}

// ============================================================================
// 8. FAMILY MANAGEMENT & MULTI-STUDENT SIBLING PROFILES
// ============================================================================

router.use('/family', requireAuth);

// Return only the authenticated guardian's family and verified child records.
router.get('/family/mine', requireRole(['guardian']), (req: AuthenticatedRequest, res: Response) => {
  const guardianId = req.user!.userId;
  const family = Array.from(dataStore.families.values()).find((candidate) =>
    candidate.primaryGuardianId === guardianId ||
    Array.from(dataStore.familyMembers.values()).some(
      (member) => member.familyId === candidate.id && member.userId === guardianId && member.role === 'guardian'
    )
  );

  if (!family) return res.json({ success: true, family: null, children: [] });

  const children = Array.from(dataStore.familyMembers.values())
    .filter((member) => member.familyId === family.id && member.role === 'student')
    .map((member) => dataStore.users.get(member.userId))
    .filter((student): student is NonNullable<typeof student> => Boolean(student && student.role === 'student'))
    .map((student) => {
      const attempts = Array.from(dataStore.quizAttempts.values()).filter((attempt) => attempt.studentId === student.id);
      const submissions = Array.from(dataStore.submissions.values()).filter((submission) => submission.studentId === student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        loginCode: student.studentProfile?.rollNumber,
        classGrade: student.studentProfile?.classGrade,
        attendancePercent: student.studentProfile?.attendancePercent,
        completedTopicsCount: student.studentProfile?.completedTopicIds?.length || 0,
        quizAttempts: attempts.length,
        averageQuizPercentage: attempts.length
          ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
          : null,
        assignmentSubmissions: submissions.length,
      };
    });

  return res.json({ success: true, family: { id: family.id, name: family.name }, children });
});

// POST /api/family/create
router.post('/family/create', requireRole(['guardian', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Family name is required.' });
  }

  const famId = 'fam_' + Date.now().toString(36);
  const primaryGuardianId = user!.userId;

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
router.post('/family/add-student', requireRole(['guardian', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
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

  if (!isGuardianForFamily(user!, family)) {
    return res.status(403).json({ error: 'Access denied. You are not a guardian of this family.' });
  }

  const cleanName = String(fullName).trim();
  const grade = parseInt(classGrade, 10) || 10;
  const studentId = 'user_student_' + crypto.randomUUID();
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4}$/.test(cleanPin)) return res.status(400).json({ error: 'Student PIN must be exactly 4 digits.' });
  if (!securityAnswer || !String(securityAnswer).trim()) return res.status(400).json({ error: 'A security answer is required for PIN recovery.' });

  let loginCode = '';
  do {
    loginCode = `VP-${grade}-${crypto.randomInt(100000, 1000000)}`;
  } while (Array.from(dataStore.users.values()).some((candidate) => candidate.studentProfile?.rollNumber === loginCode));

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
      institutionId: 'inst_global',
      departmentId: 'independent',
      programmeId: 'CLASS-10',
      semester: 1,
      admissionYear: String(new Date().getFullYear()),
      classGrade: grade,
      securityQuestionId: securityQuestionId || 'subject',
      securityQuestion: securityQuestion || 'What is your favorite school subject?',
      securityAnswerHash: crypto.createHash('sha256').update(String(securityAnswer).trim().toLowerCase()).digest('hex'),
      rollNumber: loginCode,
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
router.post('/family/link-student', requireRole(['guardian', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const { familyId, studentCode } = req.body;
  if (!familyId || !studentCode) {
    return res.status(400).json({ error: 'Family ID and Student Code are required.' });
  }

  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  if (!isGuardianForFamily(user!, family)) {
    return res.status(403).json({ error: 'Access denied. You are not a guardian of this family.' });
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
router.get('/family/:familyId/children', requireRole(['guardian', 'student', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  if (user!.role === 'guardian' && !isGuardianForFamily(user!, family)) {
    return res.status(403).json({ error: 'Guardians can only view children in their own family.' });
  }
  if (user!.role === 'student' && !Array.from(dataStore.familyMembers.values()).some(
    (member) => member.familyId === familyId && member.userId === user!.userId
  )) {
    return res.status(403).json({ error: 'You can only view your own family profile.' });
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
      classGrade: u.studentProfile?.classGrade,
      completedTopicsCount: u.studentProfile?.completedTopicIds?.length || 0,
      attendancePercent: u.studentProfile?.attendancePercent,
    }));

  return res.json({
    success: true,
    family: { id: family.id, name: family.name },
    children,
  });
});

// GET /api/family/children/:id
router.get('/family/children/:id', requireRole(['guardian', 'student', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetUser = dataStore.users.get(studentId);
  if (!targetUser || targetUser.role !== 'student') {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  if (!guardianCanAccessStudent(user!, studentId)) {
    return res.status(403).json({ error: 'Access denied. You are not linked to this student.' });
  }

  return res.json({
    success: true,
    child: {
      id: targetUser.id,
      fullName: targetUser.fullName,
      loginCode: targetUser.studentProfile?.rollNumber || targetUser.id,
      completedTopicIds: targetUser.studentProfile?.completedTopicIds || [],
      attendancePercent: targetUser.studentProfile?.attendancePercent,
      createdAt: targetUser.createdAt,
    },
  });
});

// ============================================================================
// PHASE 5: VERIFIED GUARDIAN DASHBOARD & SHARED-DEVICE FAMILY MANAGER
// ============================================================================

// GET /api/family/:familyId/overview
// Comprehensive Guardian Dashboard overview across all children (multi-child switcher)
router.get('/family/:familyId/overview', requireRole(['guardian', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  if (!isGuardianForFamily(user!, family)) {
    return res.status(403).json({ error: 'Access denied. You can only view your own family dashboard.' });
  }

  const memberStudentIds = Array.from(dataStore.familyMembers.values())
    .filter((m) => m.familyId === familyId && m.role === 'student')
    .map((m) => m.userId);

  const childrenOverview = memberStudentIds.map((studentId) => {
    const studentUser = dataStore.users.get(studentId);
    const profile = studentUser?.studentProfile;

    // Quiz telemetry
    const attempts = Array.from(dataStore.quizAttempts.values()).filter((a) => a.studentId === studentId);
    const passedCount = attempts.filter((a) => a.passed).length;
    const avgScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
        : 0;

    // Assignment telemetry
    const submissions = Array.from(dataStore.submissions.values()).filter((s) => s.studentId === studentId);
    const gradedSubmissions = submissions.filter((s) => s.status === 'graded');

    // AI Conversations
    const convs = Array.from(dataStore.aiConversations.values()).filter((c) => c.studentId === studentId);

    return {
      studentId,
      fullName: studentUser?.fullName || 'Child',
      loginCode: profile?.rollNumber || studentId,
      classGrade: profile?.classGrade || 10,
      board: profile?.board,
      state: profile?.state,
      isIndependent: profile?.isIndependent,
      attendancePercent: profile?.attendancePercent,
      completedTopicsCount: profile?.completedTopicIds?.length || 0,
      quizzes: {
        totalAttempted: attempts.length,
        passedCount,
        averagePercentage: avgScore,
        recentAttempts: attempts.slice(-3),
      },
      assignments: {
        totalSubmitted: submissions.length,
        gradedCount: gradedSubmissions.length,
        recentFeedback: gradedSubmissions.slice(-3).map((g) => ({
          assignmentId: g.assignmentId,
          marksObtained: g.marksObtained,
          feedback: g.feedback,
        })),
      },
      aiTutorActivity: {
        conversationsCount: convs.length,
        activeTopics: convs.map((c) => c.topicId).filter(Boolean),
      },
    };
  });

  return res.json({
    success: true,
    family: { id: family.id, name: family.name },
    childrenCount: childrenOverview.length,
    children: childrenOverview,
  });
});

// POST /api/family/:familyId/children/:studentId/reset-pin
// Guardian resets their child's 4-digit PIN directly from the Guardian Dashboard
router.post('/family/:familyId/children/:studentId/reset-pin', requireRole(['guardian', 'super_admin']), (req: AuthenticatedRequest, res: Response) => {
  const user = optionalOrRequiredAuth(req);
  const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
  const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
  const { newPin } = req.body;

  if (!newPin || !/^\d{4}$/.test(String(newPin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  const family = dataStore.families.get(familyId);
  if (!family) {
    return res.status(404).json({ error: 'Family not found.' });
  }

  if (!isGuardianForFamily(user!, family)) {
    return res.status(403).json({ error: 'Access denied. Only a guardian of this family can reset child PINs.' });
  }

  const isChildInFamily = Array.from(dataStore.familyMembers.values()).some(
    (m) => m.familyId === familyId && m.userId === studentId && m.role === 'student'
  );
  if (!isChildInFamily) {
    return res.status(404).json({ error: 'Child is not a member of this family.' });
  }

  const studentUser = dataStore.users.get(studentId);
  if (!studentUser) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  // Hash new PIN
  const pwd = dataStore.hashPassword(String(newPin));
  studentUser.passwordHash = pwd.hash;
  studentUser.salt = pwd.salt;
  dataStore.users.set(studentId, studentUser);

  dataStore.logAudit({
    category: 'auth',
    action: 'GUARDIAN_CHILD_PIN_RESET',
    details: { familyId, studentId, guardianId: user!.userId },
  });

  return res.json({
    success: true,
    message: `PIN for ${studentUser.fullName} has been reset successfully.`,
  });
});

// ============================================================================
// 9. COURSES & ACADEMIC MANAGEMENT (L2 Institution Admin Direct Control)
// ============================================================================

// POST /api/courses
router.post('/courses', requireAuth, requireRole(['super_admin', 'institution_admin', 'academic_admin']), requireInstitutionScope((req) => req.body?.institutionId || (req as AuthenticatedRequest).user?.institutionId), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const { code, title, institutionId, description, syllabus } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: 'Course code and title are required.' });
  }
  const targetInstitutionId = String(institutionId || user.institutionId || '');
  if (!targetInstitutionId) return res.status(400).json({ error: 'Institution ID is required for a platform administrator.' });

  const courseId = 'course_' + Date.now().toString(36);
  const newCourse: Course = {
    id: courseId,
    code: String(code).trim().toUpperCase(),
    title: String(title).trim(),
    institutionId: targetInstitutionId,
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

// ============================================================================
// PHASE 2: GLOBAL COURSE CATALOG & STATE SSC / CBSE ENGINE (CLASSES 1-10 FREE)
// ============================================================================

// Helper: Seed standard Pan-India Global Courses (Classes 1-10 Strictly 100% Free)
function ensureGlobalCoursesSeeded() {
  const existingGlobals = Array.from(dataStore.courses.values()).filter((c) => c.scope === 'global');
  if (existingGlobals.length > 0) return;

  const standardCourses: Partial<Course>[] = [
    {
      id: 'course_ap_ssc_10_maths_te',
      code: 'AP-SSC-10-MATHS',
      title: 'Class 10 Mathematics (AP State Board SSC)',
      classGrade: 10,
      board: 'State SSC',
      state: 'Andhra Pradesh',
      subjectName: 'Mathematics',
      language: 'te',
      description: 'Complete SSC syllabus including Real Numbers, Sets, Polynomials, and Trigonometry taught in native Telugu.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'వాస్తవ సంఖ్యలు (Real Numbers)', topics: ['యూక్లిడ్ భాగహార న్యాయం', 'అంకగణిత ప్రాథమిక సిద్ధాంతం'] },
        { unitNumber: 2, title: 'సమితులు (Sets)', topics: ['సమితుల రకాలు', 'వెన్ చిత్రాలు', 'సమ్మేళనం మరియు ఛేదనం'] },
        { unitNumber: 3, title: 'బహుపదులు (Polynomials)', topics: ['బహుపది శూన్యాలు', 'రేఖాత్మక మరియు వర్గ బహుపదులు'] },
      ],
    },
    {
      id: 'course_cbse_10_maths_hi',
      code: 'CBSE-10-MATHS-HI',
      title: 'Class 10 Mathematics (CBSE Pan-India)',
      classGrade: 10,
      board: 'CBSE',
      state: 'All India',
      subjectName: 'Mathematics',
      language: 'hi',
      description: 'NCERT aligned Class 10 CBSE mathematics curriculum with step-by-step Socratic practice in Hindi.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'वास्तविक संख्याएँ (Real Numbers)', topics: ['यूक्लिड विभाजन प्रमेयिका', 'अपरिमेय संख्याओं का पुनर्भ्रमण'] },
        { unitNumber: 2, title: 'बहुपद (Polynomials)', topics: ['शून्यकों का ज्यामितीय अर्थ', 'विभाजन एल्गोरिद्म'] },
      ],
    },
    {
      id: 'course_cbse_10_maths_en',
      code: 'CBSE-10-MATHS-EN',
      title: 'Class 10 Mathematics (CBSE Pan-India)',
      classGrade: 10,
      board: 'CBSE',
      state: 'All India',
      subjectName: 'Mathematics',
      language: 'en',
      description: 'Comprehensive CBSE Class 10 Maths with bilingual voice tutor and offline practice sets.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'Real Numbers', topics: ['Fundamental Theorem of Arithmetic', 'Revisiting Irrational Numbers'] },
        { unitNumber: 2, title: 'Polynomials', topics: ['Geometrical Meaning of Zeroes', 'Relationship between Zeroes and Coefficients'] },
      ],
    },
    {
      id: 'course_ts_ssc_10_maths_te',
      code: 'TS-SSC-10-MATHS',
      title: 'Class 10 Mathematics (Telangana State SSC)',
      classGrade: 10,
      board: 'State SSC',
      state: 'Telangana',
      subjectName: 'Mathematics',
      language: 'te',
      description: 'Telangana SCERT Class 10 syllabus with localized examples and Telugu voice tutoring.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'వాస్తవ సంఖ్యలు', topics: ['అకరణీయ సంఖ్యలు', 'సంవర్గమానాలు (Logarithms)'] },
      ],
    },
    {
      id: 'course_cbse_08_maths_en',
      code: 'CBSE-08-MATHS-EN',
      title: 'Class 8 Mathematics (CBSE)',
      classGrade: 8,
      board: 'CBSE',
      state: 'All India',
      subjectName: 'Mathematics',
      language: 'en',
      description: 'Foundational middle school algebra and geometry with visual problem breakdown.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'Rational Numbers', topics: ['Properties of Rational Numbers', 'Representation on Number Line'] },
      ],
    },
    {
      id: 'course_cbse_05_evs_en',
      code: 'CBSE-05-EVS-EN',
      title: 'Class 5 Environmental Studies (EVS)',
      classGrade: 5,
      board: 'CBSE',
      state: 'All India',
      subjectName: 'Environmental Studies',
      language: 'en',
      description: 'Primary school nature exploration and science foundations with audio-visual stories.',
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      syllabus: [
        { unitNumber: 1, title: 'Super Senses', topics: ['How Animals Sense', 'Ecosystem Wonders'] },
      ],
    },
  ];

  for (const c of standardCourses) {
    const fullCourse: Course = {
      id: c.id!,
      code: c.code!,
      title: c.title!,
      institutionId: 'global',
      scope: 'global',
      classGrade: c.classGrade,
      board: c.board,
      state: c.state,
      subjectName: c.subjectName,
      language: c.language,
      isFree: true,
      feeAmount: 0,
      feeCurrency: 'INR',
      description: c.description || '',
      syllabus: c.syllabus || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dataStore.courses.set(fullCourse.id, fullCourse);
  }
}

// POST /api/courses/global/publish
// Super Admin publishes standardized global courses.
// Strict Business Rule: Classes 1 to 10 are ALWAYS 100% Free (isFree: true, feeAmount: 0).
router.post('/courses/global/publish', requireAuth, requireRole(['super_admin']), (req: Request, res: Response) => {

  const { code, title, classGrade, board, state, subjectName, language, description, syllabus, isFree, feeAmount } = req.body;

  if (!code || !title) {
    return res.status(400).json({ error: 'Course code and title are required.' });
  }

  const grade = Number(classGrade) || 10;
  const isClass1to10 = grade >= 1 && grade <= 10;

  // Strict Policy Enforcement: Classes 1 to 10 CANNOT have paywalls
  const guaranteedFree = isClass1to10 ? true : (isFree !== undefined ? Boolean(isFree) : true);
  const guaranteedFee = isClass1to10 ? 0 : (guaranteedFree ? 0 : Number(feeAmount || 0));

  const courseId = 'course_glob_' + Date.now().toString(36);
  const newCourse: Course = {
    id: courseId,
    code: String(code).trim().toUpperCase(),
    title: String(title).trim(),
    institutionId: 'global',
    scope: 'global',
    classGrade: grade,
    board: board || 'State SSC',
    state: state || 'All India',
    subjectName: subjectName || 'General',
    language: language || 'en',
    description: description || '',
    syllabus: syllabus || [],
    isFree: guaranteedFree,
    feeAmount: guaranteedFee,
    feeCurrency: 'INR',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  dataStore.courses.set(courseId, newCourse);

  dataStore.logAudit({
    category: 'academic',
    action: 'GLOBAL_COURSE_PUBLISHED',
    details: {
      courseId,
      code: newCourse.code,
      title: newCourse.title,
      classGrade: newCourse.classGrade,
      board: newCourse.board,
      state: newCourse.state,
      isFree: newCourse.isFree,
    },
  });

  return res.status(201).json({
    success: true,
    message: isClass1to10
      ? `Global Course for Class ${grade} published successfully under Mandatory 100% Free Tier.`
      : `Global Course for Class ${grade} published successfully.`,
    course: newCourse,
  });
});

// GET /api/courses/global
// Browse and filter the Pan-India Global Course Catalog
router.get('/courses/global', (req: Request, res: Response) => {
  ensureGlobalCoursesSeeded();

  const { classGrade, board, state, language, search } = req.query;

  let list = Array.from(dataStore.courses.values()).filter((c) => c.scope === 'global');

  if (classGrade) {
    const g = Number(classGrade);
    list = list.filter((c) => c.classGrade === g);
  }

  if (board) {
    const b = String(board).trim().toLowerCase();
    list = list.filter((c) => c.board?.toLowerCase() === b || (b === 'state_ssc' && c.board?.toLowerCase().includes('state')));
  }

  if (state) {
    const s = String(state).trim().toLowerCase();
    list = list.filter((c) => c.state?.toLowerCase().includes(s) || c.state?.toLowerCase() === 'all india');
  }

  if (language) {
    const lang = String(language).trim().toLowerCase();
    list = list.filter((c) => c.language === lang);
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
    );
  }

  // Sort by classGrade ascending, then title
  list.sort((a, b) => (a.classGrade || 0) - (b.classGrade || 0) || a.title.localeCompare(b.title));

  return res.json({
    success: true,
    count: list.length,
    courses: list,
  });
});

// POST /api/courses/global/:id/enroll
// Enrolls an independent or institutional learner into a global course
router.post('/courses/global/:id/enroll', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
  ensureGlobalCoursesSeeded();

  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetStudentId = req.user!.userId;

  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Global course not found.' });
  }

  // Check existing enrollment
  const existing = Array.from(dataStore.courseEnrollments.values()).find(
    (e) => e.courseId === courseId && e.studentId === targetStudentId
  );
  if (existing) {
    return res.json({
      success: true,
      message: 'Student is already enrolled in this course.',
      enrollment: existing,
      course,
    });
  }

  const enrollmentId = 'enr_glob_' + Date.now().toString(36);
  const enrollment: CourseEnrollment = {
    id: enrollmentId,
    courseId,
    studentId: targetStudentId,
    status: 'active',
    enrolledAt: Date.now(),
  };

  dataStore.courseEnrollments.set(enrollmentId, enrollment);

  // If student profile exists in store, enrich it with course academic context
  const existingUser = dataStore.users.get(targetStudentId);
  if (existingUser && existingUser.studentProfile) {
    existingUser.studentProfile.classGrade = course.classGrade;
    existingUser.studentProfile.board = course.board;
    existingUser.studentProfile.state = course.state;
  }

  dataStore.logAudit({
    category: 'academic',
    action: 'GLOBAL_COURSE_ENROLLMENT',
    details: {
      enrollmentId,
      courseId,
      courseCode: course.code,
      studentId: targetStudentId,
      isFree: course.isFree,
    },
  });

  return res.status(201).json({
    success: true,
    message: course.isFree
      ? `Enrolled in ${course.title} successfully under the Free Public Curriculum.`
      : `Enrolled in ${course.title} successfully.`,
    enrollment,
    course,
  });
});

// GET /api/courses
router.get('/courses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const institutionId = req.user!.role === 'super_admin' ? undefined : req.user!.institutionId;
  const courseList = Array.from(dataStore.courses.values())
    .filter((course) => course.scope === 'global' || course.institutionId === 'global' || (institutionId && course.institutionId === institutionId))
    .sort((a, b) => b.createdAt - a.createdAt);
  return res.json({ success: true, courses: courseList });
});

// GET /api/courses/:id
router.get('/courses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }
  if (course.scope !== 'global' && course.institutionId !== 'global' && req.user!.role !== 'super_admin' && req.user!.institutionId !== course.institutionId) {
    return res.status(403).json({ error: 'Access is limited to your institution.' });
  }
  return res.json({ success: true, course });
});

// POST /api/courses/:id/enroll
router.post('/courses/:id/enroll', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const studentId = req.user!.userId;

  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }
  if (course.scope !== 'global' && course.institutionId !== 'global' && req.user!.institutionId !== course.institutionId) {
    return res.status(403).json({ error: 'You cannot enroll in a course outside your institution.' });
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
// PHASE 3: INSTITUTION DYNAMIC PAID COURSE BUILDER (CLASSES 11+)
// ============================================================================

// POST /api/institution/courses
// Institutions create dynamic course offerings.
// Rule: Class 1-10 is strictly 100% Free; Class 11+ can configure dynamic paid plans.
router.post('/institution/courses', requireAuth, requireRole(['institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => req.body?.institutionId || (req as AuthenticatedRequest).user?.institutionId), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const {
    code,
    title,
    institutionId,
    classGrade,
    board,
    state,
    subjectName,
    language,
    description,
    syllabus,
    isFree,
    feeAmount,
    feeCurrency,
    billingCycle,
  } = req.body;

  if (!code || !title) {
    return res.status(400).json({ error: 'Course code and title are required.' });
  }

  const instId = String(institutionId || user.institutionId || '');
  if (!instId) return res.status(400).json({ error: 'Institution ID is required for a platform administrator.' });
  const grade = Number(classGrade) || 11;
  const isClass1to10 = grade >= 1 && grade <= 10;

  // Strict Policy Enforcement: Even in an institution, Classes 1 to 10 CANNOT have paywalls
  const enforcedFree = isClass1to10 ? true : (isFree !== undefined ? Boolean(isFree) : true);
  const enforcedFee = isClass1to10 ? 0 : (enforcedFree ? 0 : Number(feeAmount || 0));

  const courseId = 'course_inst_' + Date.now().toString(36);
  const newCourse: Course = {
    id: courseId,
    code: String(code).trim().toUpperCase(),
    title: String(title).trim(),
    institutionId: instId,
    scope: 'institution',
    classGrade: grade,
    board: board || 'State Board',
    state: state || 'Telangana',
    subjectName: subjectName || 'General',
    language: language || 'en',
    description: description || '',
    syllabus: syllabus || [],
    isFree: enforcedFree,
    feeAmount: enforcedFee,
    feeCurrency: feeCurrency || 'INR',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  dataStore.courses.set(courseId, newCourse);

  dataStore.logAudit({
    category: 'academic',
    action: 'INSTITUTION_COURSE_CREATED',
    institutionId: instId,
    details: {
      courseId,
      code: newCourse.code,
      title: newCourse.title,
      classGrade: newCourse.classGrade,
      isFree: newCourse.isFree,
      feeAmount: newCourse.feeAmount,
      billingCycle,
    },
  });

  return res.status(201).json({
    success: true,
    message: isClass1to10
      ? `Institutional Course for Class ${grade} created under Mandatory Free Tier.`
      : newCourse.isFree
      ? `Institutional Course created with Free Open Access.`
      : `Institutional Course created with Dynamic Paid Plan (₹${enforcedFee}).`,
    course: newCourse,
  });
});

// GET /api/institution/:institutionId/courses
// List all dynamic course offerings configured by an institution
router.get('/institution/:institutionId/courses', requireAuth, requireRole(['student', 'guardian', 'teacher', 'institution_admin', 'academic_admin', 'super_admin']), requireInstitutionScope((req) => req.params.institutionId), (req: Request, res: Response) => {
  const instId = Array.isArray(req.params.institutionId) ? req.params.institutionId[0] : req.params.institutionId;
  const { classGrade, isFree } = req.query;

  let list = Array.from(dataStore.courses.values()).filter((c) => c.institutionId === instId);

  if (classGrade) {
    const g = Number(classGrade);
    list = list.filter((c) => c.classGrade === g);
  }

  if (isFree !== undefined) {
    const f = isFree === 'true';
    list = list.filter((c) => c.isFree === f);
  }

  list.sort((a, b) => (a.classGrade || 0) - (b.classGrade || 0) || a.title.localeCompare(b.title));

  return res.json({
    success: true,
    institutionId: instId,
    count: list.length,
    courses: list,
  });
});

// POST /api/institution/courses/:id/enroll
// Enrolls student into an institutional course, enforcing payment validation for paid plans
router.post('/institution/courses/:id/enroll', requireAuth, requireRole(['student']), (req: AuthenticatedRequest, res: Response) => {
  const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetStudentId = req.user!.userId;

  const course = dataStore.courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Institutional course not found.' });
  }
  if (req.user!.institutionId !== course.institutionId) {
    return res.status(403).json({ error: 'You cannot enroll in a course outside your institution.' });
  }

  // Check existing enrollment
  const existing = Array.from(dataStore.courseEnrollments.values()).find(
    (e) => e.courseId === courseId && e.studentId === targetStudentId
  );
  if (existing) {
    return res.json({
      success: true,
      message: 'Student is already enrolled in this course.',
      enrollment: existing,
      course,
    });
  }

  const enrollmentId = 'enr_inst_' + Date.now().toString(36);
  // A client flag is not proof of payment. Paid enrollments stay pending until
  // a trusted payment provider webhook confirms settlement.
  const isPaidRequired = !course.isFree;

  const enrollment: CourseEnrollment = {
    id: enrollmentId,
    courseId,
    studentId: targetStudentId,
    status: isPaidRequired ? 'pending_payment' : 'active',
    feePaid: isPaidRequired ? 0 : course.feeAmount || 0,
    paymentReference: undefined,
    enrolledAt: Date.now(),
  };

  dataStore.courseEnrollments.set(enrollmentId, enrollment);

  dataStore.logAudit({
    category: 'academic',
    action: isPaidRequired ? 'COURSE_PAYMENT_PENDING' : 'COURSE_ENROLLED_ACTIVE',
    institutionId: course.institutionId,
    details: {
      enrollmentId,
      courseId,
      studentId: targetStudentId,
      status: enrollment.status,
      feeAmount: course.feeAmount,
    },
  });

  return res.status(201).json({
    success: true,
    paymentRequired: isPaidRequired,
    message: isPaidRequired
      ? `Enrollment initiated. Course requires fee of ₹${course.feeAmount}. Please complete payment.`
      : `Enrolled successfully in ${course.title}.`,
    enrollment,
    course,
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
