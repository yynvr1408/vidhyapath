import pkg from 'pg';
const { Pool } = pkg;
import {
  Institution,
  User,
  Department,
  Programme,
  AcademicYear,
  Subject,
  CurriculumUnit,
  LearningResource,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  Announcement,
  NotificationItem,
  AiSafetyPolicy,
  AuditLog,
  OtpRecord,
  Family,
  FamilyMember,
  Guardianship,
  Course,
  CourseEnrollment,
  AiConversation,
  AiMessage,
} from '../../src/types/enterprise.js';
import { dataStore } from './store.js';

let poolInstance: any = null;

export function getPool() {
  if (!poolInstance && process.env.DATABASE_URL) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return poolInstance;
}

let isConnected = false;

// 1. DDL for all 20 Enterprise Relational Tables in Neon PostgreSQL
const ENTERPRISE_SCHEMA_DDL = `
-- 1. Institutions
CREATE TABLE IF NOT EXISTS institutions (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(32) NOT NULL,
  address TEXT,
  contact_email VARCHAR(128),
  contact_phone VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  website_url TEXT,
  logo_url TEXT,
  academic_years JSONB DEFAULT '[]'::jsonb,
  ai_policy JSONB,
  created_at BIGINT NOT NULL,
  approved_at BIGINT
);

-- 2. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  year_label VARCHAR(32) NOT NULL,
  is_current BOOLEAN DEFAULT false,
  start_date VARCHAR(32),
  end_date VARCHAR(32)
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code VARCHAR(32) NOT NULL,
  hod_user_id VARCHAR(64),
  hod_name VARCHAR(128),
  created_at BIGINT NOT NULL
);

-- 4. Programmes
CREATE TABLE IF NOT EXISTS programmes (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  department_id VARCHAR(64) REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code VARCHAR(32) NOT NULL,
  degree_type VARCHAR(32) NOT NULL,
  total_semesters INT DEFAULT 8,
  created_at BIGINT NOT NULL
);

-- 5. Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE SET NULL,
  institution_name TEXT,
  role VARCHAR(32) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(32),
  password_hash TEXT NOT NULL,
  salt VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  student_profile JSONB,
  teacher_profile JSONB,
  created_at BIGINT NOT NULL,
  last_login_at BIGINT
);

-- 6. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  department_id VARCHAR(64),
  programme_id VARCHAR(64),
  semester INT DEFAULT 1,
  name TEXT NOT NULL,
  code VARCHAR(32) NOT NULL,
  credits INT DEFAULT 3,
  description TEXT,
  syllabus_version VARCHAR(32),
  is_published BOOLEAN DEFAULT true,
  assigned_teacher_ids JSONB DEFAULT '[]'::jsonb,
  units JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 7. Curriculum Units
CREATE TABLE IF NOT EXISTS curriculum_units (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  unit_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topics JSONB DEFAULT '[]'::jsonb
);

-- 8. Learning Resources
CREATE TABLE IF NOT EXISTS learning_resources (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id VARCHAR(64),
  topic_id VARCHAR(64),
  teacher_id VARCHAR(64),
  teacher_name VARCHAR(128),
  resource_type VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  content_text TEXT,
  video_url TEXT,
  meeting_url TEXT,
  scheduled_at BIGINT,
  duration_mins INT,
  created_at BIGINT NOT NULL
);

-- 9. Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id VARCHAR(64),
  teacher_id VARCHAR(64),
  teacher_name VARCHAR(128),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date BIGINT NOT NULL,
  max_marks INT DEFAULT 100,
  submissions_count INT DEFAULT 0,
  created_at BIGINT NOT NULL
);

-- 10. Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id VARCHAR(64) PRIMARY KEY,
  assignment_id VARCHAR(64) REFERENCES assignments(id) ON DELETE CASCADE,
  student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(128),
  content_text TEXT,
  file_url TEXT,
  status VARCHAR(32) DEFAULT 'submitted',
  marks_obtained NUMERIC(5,2),
  feedback TEXT,
  submitted_at BIGINT NOT NULL,
  graded_at BIGINT
);

-- 11. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id VARCHAR(64),
  teacher_id VARCHAR(64),
  title TEXT NOT NULL,
  time_limit_minutes INT DEFAULT 20,
  pass_percentage INT DEFAULT 50,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL
);

-- 12. Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR(64) PRIMARY KEY,
  quiz_id VARCHAR(64) REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(128),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  selected_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at BIGINT NOT NULL
);

-- 13. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  department_id VARCHAR(64),
  subject_id VARCHAR(64),
  author_id VARCHAR(64),
  author_name VARCHAR(128),
  author_role VARCHAR(32),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(16) DEFAULT 'normal',
  target_role VARCHAR(32) DEFAULT 'all',
  created_at BIGINT NOT NULL
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at BIGINT NOT NULL
);

-- 15. AI Policies
CREATE TABLE IF NOT EXISTS ai_policies (
  institution_id VARCHAR(64) PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
  max_daily_queries_student INT DEFAULT 30,
  block_exam_keywords BOOLEAN DEFAULT true,
  require_syllabus_grounding BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  allowed_keywords JSONB DEFAULT '[]'::jsonb,
  blocked_keywords JSONB DEFAULT '[]'::jsonb
);

-- 16. OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(128) NOT NULL,
  otp_hash VARCHAR(128) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  user_email VARCHAR(128),
  institution_id VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at BIGINT NOT NULL
);

-- 18. Sync Events
CREATE TABLE IF NOT EXISTS sync_events (
  event_id VARCHAR(64) PRIMARY KEY,
  learner_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  skill_id VARCHAR(64) NOT NULL,
  chosen_answer VARCHAR(16),
  correct BOOLEAN NOT NULL,
  hints_used INT DEFAULT 0,
  time_ms INT DEFAULT 0,
  input_mode VARCHAR(16) DEFAULT 'tap',
  receipt_hash VARCHAR(64),
  created_at BIGINT NOT NULL
);

-- 19. Doubts Queue
CREATE TABLE IF NOT EXISTS doubts_queue (
  id VARCHAR(64) PRIMARY KEY,
  learner_id VARCHAR(64) NOT NULL,
  topic_id VARCHAR(64),
  question TEXT NOT NULL,
  answer TEXT,
  audio_url TEXT,
  photo_url TEXT,
  input_mode VARCHAR(16) DEFAULT 'text',
  status VARCHAR(20) DEFAULT 'queued',
  created_at BIGINT NOT NULL
);

-- 20. Cohort Aggregates
CREATE TABLE IF NOT EXISTS cohort_aggregates (
  cohort_id VARCHAR(64) PRIMARY KEY,
  cohort_name TEXT NOT NULL,
  sponsor_name TEXT NOT NULL,
  active_learners INT DEFAULT 0,
  sessions_completed INT DEFAULT 0,
  avg_mastery_gain NUMERIC(5,2) DEFAULT 0.0,
  offline_sessions_percent NUMERIC(5,2) DEFAULT 0.0,
  cost_per_learner NUMERIC(6,2) DEFAULT 0.0,
  updated_at BIGINT NOT NULL
);

-- 21. Families (Family Multi-Student Management)
CREATE TABLE IF NOT EXISTS families (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  primary_guardian_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 22. Family Members
CREATE TABLE IF NOT EXISTS family_members (
  id VARCHAR(64) PRIMARY KEY,
  family_id VARCHAR(64) REFERENCES families(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL,
  created_at BIGINT NOT NULL
);

-- 23. Guardianships
CREATE TABLE IF NOT EXISTS guardianships (
  id VARCHAR(64) PRIMARY KEY,
  guardian_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(64) DEFAULT 'parent',
  created_at BIGINT NOT NULL
);

-- 24. Courses (Centralized Curriculum Management)
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE CASCADE,
  description TEXT,
  syllabus JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 25. Course Enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id VARCHAR(64) PRIMARY KEY,
  course_id VARCHAR(64) REFERENCES courses(id) ON DELETE CASCADE,
  student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'active',
  enrolled_at BIGINT NOT NULL
);

-- 26. AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  topic_id VARCHAR(64),
  language VARCHAR(16) NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 27. AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) REFERENCES ai_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(16) NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT,
  photo_url TEXT,
  created_at BIGINT NOT NULL
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON learning_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_announcements_institution ON announcements(institution_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_families_guardian ON families(primary_guardian_id);
CREATE INDEX IF NOT EXISTS idx_family_members_fam ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_guardianships_g ON guardianships(guardian_id);
CREATE INDEX IF NOT EXISTS idx_courses_inst ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_student ON ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id);
`;

/**
 * Initializes Neon Serverless PostgreSQL:
 * 1. Executes DDL for 20 Enterprise tables and indexes.
 * 2. If database is empty, seeds default institutions, users, subjects, etc.
 * 3. If database already has rows, synchronizes database data into in-memory store.
 */
export async function initNeonDb(): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    console.log('[Neon DB] No DATABASE_URL set. Running in local fallback mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(ENTERPRISE_SCHEMA_DDL);
      isConnected = true;
      console.log('[Neon DB] All 27 Enterprise Relational Tables & Indexes verified.');

      // Register live synchronization listeners with in-memory store
      dataStore.registerSyncListeners({
        onSaveInstitution: (inst) => { saveInstitutionToNeon(inst).catch((e) => console.error('[Neon] sync inst error:', e.message)); },
        onSaveUser: (user) => { saveUserToNeon(user).catch((e) => console.error('[Neon] sync user error:', e.message)); },
        onSaveSubject: (subj) => { saveSubjectToNeon(subj).catch((e) => console.error('[Neon] sync subject error:', e.message)); },
        onSaveAssignment: (a) => { saveAssignmentToNeon(a).catch((e) => console.error('[Neon] sync assignment error:', e.message)); },
        onSaveSubmission: (sub) => { saveSubmissionToNeon(sub).catch((e) => console.error('[Neon] sync submission error:', e.message)); },
        onSaveQuiz: (q) => { saveQuizToNeon(q).catch((e) => console.error('[Neon] sync quiz error:', e.message)); },
        onSaveQuizAttempt: (att) => { saveQuizAttemptToNeon(att).catch((e) => console.error('[Neon] sync quiz attempt error:', e.message)); },
        onSaveAnnouncement: (ann) => { saveAnnouncementToNeon(ann).catch((e) => console.error('[Neon] sync announcement error:', e.message)); },
        onSaveNotification: (notif) => { saveNotificationToNeon(notif).catch((e) => console.error('[Neon] sync notification error:', e.message)); },
        onSaveOtp: (otp) => { saveOtpToNeon(otp).catch((e) => console.error('[Neon] sync otp error:', e.message)); },
        onSaveLearningResource: (lr) => { saveLearningResourceToNeon(lr).catch((e) => console.error('[Neon] sync resource error:', e.message)); },
        onSaveFamily: (fam) => { saveFamilyToNeon(fam).catch((e) => console.error('[Neon] sync family error:', e.message)); },
        onSaveFamilyMember: (mem) => { saveFamilyMemberToNeon(mem).catch((e) => console.error('[Neon] sync member error:', e.message)); },
        onSaveGuardianship: (g) => { saveGuardianshipToNeon(g).catch((e) => console.error('[Neon] sync guardianship error:', e.message)); },
        onSaveCourse: (c) => { saveCourseToNeon(c).catch((e) => console.error('[Neon] sync course error:', e.message)); },
        onSaveCourseEnrollment: (ce) => { saveCourseEnrollmentToNeon(ce).catch((e) => console.error('[Neon] sync enrollment error:', e.message)); },
        onSaveAiConversation: (ac) => { saveAiConversationToNeon(ac).catch((e) => console.error('[Neon] sync conversation error:', e.message)); },
        onSaveAiMessage: (am) => { saveAiMessageToNeon(am).catch((e) => console.error('[Neon] sync message error:', e.message)); },
        onLogAudit: (entry) => { logAuditToNeon(entry).catch((e) => console.error('[Neon] sync audit error:', e.message)); },
      });

      // Check if DB is already seeded
      const countRes = await client.query('SELECT COUNT(*) as cnt FROM institutions');
      const instCount = parseInt(countRes.rows[0]?.cnt || '0', 10);

      if (instCount === 0) {
        console.log('[Neon DB] First-time initialization: Seeding default Enterprise data to Neon PostgreSQL...');
        await seedDefaultDataToNeon(client);
        console.log('[Neon DB] Seeding completed successfully.');
      } else {
        console.log(`[Neon DB] Connected with ${instCount} active institutions. Hydrating in-memory store from Neon PostgreSQL...`);
        await hydrateStoreFromNeon(client);
      }

      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Neon DB] Connection failed, falling back to in-memory store:', err.message);
    isConnected = false;
    return false;
  }
}

export function isNeonConnected(): boolean {
  return isConnected;
}

// ----------------------------------------------------------------------------
// SEEDING DEFAULT ENTERPRISE DATA TO NEON POSTGRESQL
// ----------------------------------------------------------------------------
async function seedDefaultDataToNeon(client: any) {
  // 1. Institutions
  for (const inst of dataStore.institutions.values()) {
    await client.query(
      `INSERT INTO institutions (id, name, code, type, address, contact_email, contact_phone, status, rejection_reason, website_url, logo_url, academic_years, ai_policy, created_at, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        inst.id,
        inst.name,
        inst.code,
        inst.type,
        inst.address,
        inst.contactEmail,
        inst.contactPhone,
        inst.status,
        inst.rejectionReason || null,
        inst.websiteUrl || null,
        inst.logoUrl || null,
        JSON.stringify(inst.academicYears || []),
        JSON.stringify(inst.aiPolicy || {}),
        inst.createdAt,
        inst.approvedAt || null,
      ]
    );
  }

  // 2. Departments
  for (const dept of dataStore.departments.values()) {
    await client.query(
      `INSERT INTO departments (id, institution_id, name, code, hod_user_id, hod_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [dept.id, dept.institutionId, dept.name, dept.code, dept.hodUserId || null, dept.hodName || null, dept.createdAt]
    );
  }

  // 3. Programmes
  for (const prog of dataStore.programmes.values()) {
    await client.query(
      `INSERT INTO programmes (id, institution_id, department_id, name, code, degree_type, total_semesters, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [prog.id, prog.institutionId, prog.departmentId, prog.name, prog.code, prog.degreeType, prog.totalSemesters, prog.createdAt]
    );
  }

  // 4. Users
  for (const user of dataStore.users.values()) {
    await client.query(
      `INSERT INTO users (id, institution_id, institution_name, role, full_name, email, phone, password_hash, salt, status, avatar_url, student_profile, teacher_profile, created_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.institutionId || null,
        user.institutionName || null,
        user.role,
        user.fullName,
        user.email,
        user.phone || null,
        user.passwordHash,
        user.salt,
        user.status,
        user.avatarUrl || null,
        user.studentProfile ? JSON.stringify(user.studentProfile) : null,
        user.teacherProfile ? JSON.stringify(user.teacherProfile) : null,
        user.createdAt,
        user.lastLoginAt || null,
      ]
    );
  }

  // 5. Subjects
  for (const subj of dataStore.subjects.values()) {
    await client.query(
      `INSERT INTO subjects (id, institution_id, department_id, programme_id, semester, name, code, credits, description, syllabus_version, is_published, assigned_teacher_ids, units, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        subj.id,
        subj.institutionId,
        subj.departmentId,
        subj.programmeId,
        subj.semester,
        subj.name,
        subj.code,
        subj.credits,
        subj.description,
        subj.syllabusVersion,
        subj.isPublished,
        JSON.stringify(subj.assignedTeacherIds || []),
        JSON.stringify(subj.units || []),
        subj.createdAt,
        subj.updatedAt,
      ]
    );
  }

  // 6. Learning Resources
  for (const res of dataStore.learningResources.values()) {
    await client.query(
      `INSERT INTO learning_resources (id, subject_id, unit_id, topic_id, teacher_id, teacher_name, resource_type, title, description, file_url, content_text, video_url, meeting_url, scheduled_at, duration_mins, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        res.id,
        res.subjectId,
        res.unitId,
        res.topicId || null,
        res.teacherId,
        res.teacherName,
        res.resourceType,
        res.title,
        res.description,
        res.fileUrl || null,
        res.contentText || null,
        res.videoUrl || null,
        res.meetingUrl || null,
        res.scheduledAt || null,
        res.durationMins || null,
        res.createdAt,
      ]
    );
  }

  // 7. Assignments
  for (const a of dataStore.assignments.values()) {
    await client.query(
      `INSERT INTO assignments (id, subject_id, unit_id, teacher_id, teacher_name, title, description, instructions, due_date, max_marks, submissions_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        a.id,
        a.subjectId,
        a.unitId || null,
        a.teacherId,
        a.teacherName,
        a.title,
        a.description,
        a.instructions,
        a.dueDate,
        a.maxMarks,
        a.submissionsCount || 0,
        a.createdAt,
      ]
    );
  }

  // 8. Submissions
  for (const sub of dataStore.submissions.values()) {
    await client.query(
      `INSERT INTO assignment_submissions (id, assignment_id, student_id, student_name, content_text, file_url, status, marks_obtained, feedback, submitted_at, graded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        sub.id,
        sub.assignmentId,
        sub.studentId,
        sub.studentName,
        sub.contentText,
        sub.fileUrl || null,
        sub.status,
        sub.marksObtained || null,
        sub.feedback || null,
        sub.submittedAt,
        sub.gradedAt || null,
      ]
    );
  }

  // 9. Quizzes
  for (const q of dataStore.quizzes.values()) {
    await client.query(
      `INSERT INTO quizzes (id, subject_id, unit_id, teacher_id, title, time_limit_minutes, pass_percentage, questions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        q.id,
        q.subjectId,
        q.unitId || null,
        q.teacherId,
        q.title,
        q.timeLimitMinutes,
        q.passPercentage,
        JSON.stringify(q.questions || []),
        q.createdAt,
      ]
    );
  }

  // 10. Announcements
  for (const ann of dataStore.announcements.values()) {
    await client.query(
      `INSERT INTO announcements (id, institution_id, department_id, subject_id, author_id, author_name, author_role, title, body, priority, target_role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        ann.id,
        ann.institutionId,
        ann.departmentId || null,
        ann.subjectId || null,
        ann.authorId,
        ann.authorName,
        ann.authorRole,
        ann.title,
        ann.body,
        ann.priority,
        ann.targetRole,
        ann.createdAt,
      ]
    );
  }

  // 11. Notifications
  for (const notif of dataStore.notifications.values()) {
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, read, action_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        notif.id,
        notif.userId,
        notif.title,
        notif.message,
        notif.type,
        notif.read,
        notif.actionUrl || null,
        notif.createdAt,
      ]
    );
  }
}

// ----------------------------------------------------------------------------
// HYDRATE IN-MEMORY STORE FROM NEON POSTGRESQL
// ----------------------------------------------------------------------------
async function hydrateStoreFromNeon(client: any) {
  try {
    // 1. Institutions
    const instRes = await client.query('SELECT * FROM institutions');
    for (const row of instRes.rows) {
      dataStore.institutions.set(row.id, {
        id: row.id,
        name: row.name,
        code: row.code,
        type: row.type,
        address: row.address,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        status: row.status,
        rejectionReason: row.rejection_reason,
        websiteUrl: row.website_url,
        logoUrl: row.logo_url,
        academicYears: typeof row.academic_years === 'string' ? JSON.parse(row.academic_years) : row.academic_years || [],
        aiPolicy: typeof row.ai_policy === 'string' ? JSON.parse(row.ai_policy) : row.ai_policy || {},
        createdAt: Number(row.created_at),
        approvedAt: row.approved_at ? Number(row.approved_at) : undefined,
      });
    }

    // 2. Users
    const userRes = await client.query('SELECT * FROM users');
    for (const row of userRes.rows) {
      dataStore.users.set(row.id, {
        id: row.id,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        role: row.role,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        passwordHash: row.password_hash,
        salt: row.salt,
        status: row.status,
        avatarUrl: row.avatar_url,
        studentProfile: row.student_profile ? (typeof row.student_profile === 'string' ? JSON.parse(row.student_profile) : row.student_profile) : undefined,
        teacherProfile: row.teacher_profile ? (typeof row.teacher_profile === 'string' ? JSON.parse(row.teacher_profile) : row.teacher_profile) : undefined,
        createdAt: Number(row.created_at),
        lastLoginAt: row.last_login_at ? Number(row.last_login_at) : undefined,
      });
    }

    // 3. Subjects
    const subjRes = await client.query('SELECT * FROM subjects');
    for (const row of subjRes.rows) {
      dataStore.subjects.set(row.id, {
        id: row.id,
        institutionId: row.institution_id,
        departmentId: row.department_id,
        programmeId: row.programme_id,
        semester: row.semester,
        name: row.name,
        code: row.code,
        credits: row.credits,
        description: row.description,
        syllabusVersion: row.syllabus_version,
        isPublished: row.is_published,
        assignedTeacherIds: typeof row.assigned_teacher_ids === 'string' ? JSON.parse(row.assigned_teacher_ids) : row.assigned_teacher_ids || [],
        units: typeof row.units === 'string' ? JSON.parse(row.units) : row.units || [],
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      });
    }

    // 4. Assignments
    const assignRes = await client.query('SELECT * FROM assignments');
    for (const row of assignRes.rows) {
      dataStore.assignments.set(row.id, {
        id: row.id,
        subjectId: row.subject_id,
        unitId: row.unit_id,
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        title: row.title,
        description: row.description,
        instructions: row.instructions,
        dueDate: Number(row.due_date),
        maxMarks: row.max_marks,
        submissionsCount: row.submissions_count,
        createdAt: Number(row.created_at),
      });
    }

    // 5. Quizzes
    const quizRes = await client.query('SELECT * FROM quizzes');
    for (const row of quizRes.rows) {
      dataStore.quizzes.set(row.id, {
        id: row.id,
        subjectId: row.subject_id,
        unitId: row.unit_id,
        teacherId: row.teacher_id,
        title: row.title,
        timeLimitMinutes: row.time_limit_minutes,
        passPercentage: row.pass_percentage,
        questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || [],
        createdAt: Number(row.created_at),
      });
    }

    // 6. Announcements
    const annRes = await client.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
    for (const row of annRes.rows) {
      dataStore.announcements.set(row.id, {
        id: row.id,
        institutionId: row.institution_id,
        departmentId: row.department_id,
        subjectId: row.subject_id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorRole: row.author_role,
        title: row.title,
        body: row.body,
        priority: row.priority,
        targetRole: row.target_role,
        createdAt: Number(row.created_at),
      });
    }

    // 7. Learning Resources
    const lrRes = await client.query('SELECT * FROM learning_resources');
    for (const row of lrRes.rows) {
      dataStore.learningResources.set(row.id, {
        id: row.id,
        subjectId: row.subject_id,
        unitId: row.unit_id,
        topicId: row.topic_id,
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        resourceType: row.resource_type,
        title: row.title,
        description: row.description,
        fileUrl: row.file_url,
        contentText: row.content_text,
        videoUrl: row.video_url,
        meetingUrl: row.meeting_url,
        scheduledAt: row.scheduled_at ? Number(row.scheduled_at) : undefined,
        durationMins: row.duration_mins,
        createdAt: Number(row.created_at),
      });
    }

    // 8. Families
    const famRes = await client.query('SELECT * FROM families');
    for (const row of famRes.rows) {
      dataStore.families.set(row.id, {
        id: row.id,
        name: row.name,
        primaryGuardianId: row.primary_guardian_id,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      });
    }

    // 9. Family Members
    const fmemRes = await client.query('SELECT * FROM family_members');
    for (const row of fmemRes.rows) {
      dataStore.familyMembers.set(row.id, {
        id: row.id,
        familyId: row.family_id,
        userId: row.user_id,
        role: row.role,
        createdAt: Number(row.created_at),
      });
    }

    // 10. Guardianships
    const guardRes = await client.query('SELECT * FROM guardianships');
    for (const row of guardRes.rows) {
      dataStore.guardianships.set(row.id, {
        id: row.id,
        guardianId: row.guardian_id,
        studentId: row.student_id,
        relationship: row.relationship,
        createdAt: Number(row.created_at),
      });
    }

    // 11. Courses
    const courseRes = await client.query('SELECT * FROM courses');
    for (const row of courseRes.rows) {
      dataStore.courses.set(row.id, {
        id: row.id,
        code: row.code,
        title: row.title,
        institutionId: row.institution_id,
        description: row.description,
        syllabus: typeof row.syllabus === 'string' ? JSON.parse(row.syllabus) : row.syllabus || [],
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      });
    }

    // 12. Course Enrollments
    const ceRes = await client.query('SELECT * FROM course_enrollments');
    for (const row of ceRes.rows) {
      dataStore.courseEnrollments.set(row.id, {
        id: row.id,
        courseId: row.course_id,
        studentId: row.student_id,
        status: row.status,
        enrolledAt: Number(row.enrolled_at),
      });
    }

    // 13. AI Conversations
    const convRes = await client.query('SELECT * FROM ai_conversations');
    for (const row of convRes.rows) {
      dataStore.aiConversations.set(row.id, {
        id: row.id,
        studentId: row.student_id,
        topicId: row.topic_id,
        language: row.language,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      });
    }

    // 14. AI Messages
    const msgRes = await client.query('SELECT * FROM ai_messages');
    for (const row of msgRes.rows) {
      dataStore.aiMessages.set(row.id, {
        id: row.id,
        conversationId: row.conversation_id,
        sender: row.sender,
        text: row.text,
        audioUrl: row.audio_url,
        photoUrl: row.photo_url,
        createdAt: Number(row.created_at),
      });
    }
  } catch (err: any) {
    console.warn('[Neon DB] Hydration warning:', err.message);
  }
}

// ----------------------------------------------------------------------------
// ASYNCHRONOUS PERSISTENCE OPERATIONS TO NEON POSTGRESQL
// ----------------------------------------------------------------------------

export async function saveInstitutionToNeon(inst: Institution): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO institutions (id, name, code, type, address, contact_email, contact_phone, status, rejection_reason, website_url, logo_url, academic_years, ai_policy, created_at, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         rejection_reason = EXCLUDED.rejection_reason,
         website_url = EXCLUDED.website_url,
         logo_url = EXCLUDED.logo_url,
         academic_years = EXCLUDED.academic_years,
         ai_policy = EXCLUDED.ai_policy,
         approved_at = EXCLUDED.approved_at`,
      [
        inst.id,
        inst.name,
        inst.code,
        inst.type,
        inst.address,
        inst.contactEmail,
        inst.contactPhone,
        inst.status,
        inst.rejectionReason || null,
        inst.websiteUrl || null,
        inst.logoUrl || null,
        JSON.stringify(inst.academicYears || []),
        JSON.stringify(inst.aiPolicy || {}),
        inst.createdAt,
        inst.approvedAt || null,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveInstitution error:', err.message);
    return false;
  }
}

export async function saveUserToNeon(user: User & { passwordHash: string; salt: string }): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO users (id, institution_id, institution_name, role, full_name, email, phone, password_hash, salt, status, avatar_url, student_profile, teacher_profile, created_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
         role = EXCLUDED.role,
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         password_hash = EXCLUDED.password_hash,
         salt = EXCLUDED.salt,
         status = EXCLUDED.status,
         avatar_url = EXCLUDED.avatar_url,
         student_profile = EXCLUDED.student_profile,
         teacher_profile = EXCLUDED.teacher_profile,
         last_login_at = EXCLUDED.last_login_at`,
      [
        user.id,
        user.institutionId || null,
        user.institutionName || null,
        user.role,
        user.fullName,
        user.email,
        user.phone || null,
        user.passwordHash,
        user.salt,
        user.status,
        user.avatarUrl || null,
        user.studentProfile ? JSON.stringify(user.studentProfile) : null,
        user.teacherProfile ? JSON.stringify(user.teacherProfile) : null,
        user.createdAt,
        user.lastLoginAt || null,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveUser error:', err.message);
    return false;
  }
}

export async function saveSubjectToNeon(subj: Subject): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO subjects (id, institution_id, department_id, programme_id, semester, name, code, credits, description, syllabus_version, is_published, assigned_teacher_ids, units, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         credits = EXCLUDED.credits,
         description = EXCLUDED.description,
         syllabus_version = EXCLUDED.syllabus_version,
         is_published = EXCLUDED.is_published,
         assigned_teacher_ids = EXCLUDED.assigned_teacher_ids,
         units = EXCLUDED.units,
         updated_at = EXCLUDED.updated_at`,
      [
        subj.id,
        subj.institutionId,
        subj.departmentId,
        subj.programmeId,
        subj.semester,
        subj.name,
        subj.code,
        subj.credits,
        subj.description,
        subj.syllabusVersion,
        subj.isPublished,
        JSON.stringify(subj.assignedTeacherIds || []),
        JSON.stringify(subj.units || []),
        subj.createdAt,
        subj.updatedAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveSubject error:', err.message);
    return false;
  }
}

export async function saveAssignmentToNeon(a: Assignment): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO assignments (id, subject_id, unit_id, teacher_id, teacher_name, title, description, instructions, due_date, max_marks, submissions_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         instructions = EXCLUDED.instructions,
         due_date = EXCLUDED.due_date,
         max_marks = EXCLUDED.max_marks,
         submissions_count = EXCLUDED.submissions_count`,
      [
        a.id,
        a.subjectId,
        a.unitId || null,
        a.teacherId,
        a.teacherName,
        a.title,
        a.description,
        a.instructions,
        a.dueDate,
        a.maxMarks,
        a.submissionsCount || 0,
        a.createdAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveAssignment error:', err.message);
    return false;
  }
}

export async function saveSubmissionToNeon(sub: AssignmentSubmission): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO assignment_submissions (id, assignment_id, student_id, student_name, content_text, file_url, status, marks_obtained, feedback, submitted_at, graded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         marks_obtained = EXCLUDED.marks_obtained,
         feedback = EXCLUDED.feedback,
         graded_at = EXCLUDED.graded_at`,
      [
        sub.id,
        sub.assignmentId,
        sub.studentId,
        sub.studentName,
        sub.contentText,
        sub.fileUrl || null,
        sub.status,
        sub.marksObtained || null,
        sub.feedback || null,
        sub.submittedAt,
        sub.gradedAt || null,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveSubmission error:', err.message);
    return false;
  }
}

export async function saveQuizToNeon(q: Quiz): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO quizzes (id, subject_id, unit_id, teacher_id, title, time_limit_minutes, pass_percentage, questions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         time_limit_minutes = EXCLUDED.time_limit_minutes,
         pass_percentage = EXCLUDED.pass_percentage,
         questions = EXCLUDED.questions`,
      [
        q.id,
        q.subjectId,
        q.unitId || null,
        q.teacherId,
        q.title,
        q.timeLimitMinutes,
        q.passPercentage,
        JSON.stringify(q.questions || []),
        q.createdAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveQuiz error:', err.message);
    return false;
  }
}

export async function saveQuizAttemptToNeon(att: QuizAttempt): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, student_name, score, total_questions, percentage, passed, selected_answers, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        att.id,
        att.quizId,
        att.studentId,
        att.studentName,
        att.score,
        att.totalQuestions,
        att.percentage,
        att.passed,
        JSON.stringify(att.selectedAnswers || []),
        att.completedAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveQuizAttempt error:', err.message);
    return false;
  }
}

export async function saveAnnouncementToNeon(ann: Announcement): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO announcements (id, institution_id, department_id, subject_id, author_id, author_name, author_role, title, body, priority, target_role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        ann.id,
        ann.institutionId,
        ann.departmentId || null,
        ann.subjectId || null,
        ann.authorId,
        ann.authorName,
        ann.authorRole,
        ann.title,
        ann.body,
        ann.priority,
        ann.targetRole,
        ann.createdAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveAnnouncement error:', err.message);
    return false;
  }
}

export async function saveNotificationToNeon(notif: NotificationItem): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, read, action_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET read = EXCLUDED.read`,
      [
        notif.id,
        notif.userId,
        notif.title,
        notif.message,
        notif.type,
        notif.read,
        notif.actionUrl || null,
        notif.createdAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveNotification error:', err.message);
    return false;
  }
}

export async function saveOtpToNeon(otp: OtpRecord): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO otp_verifications (id, email, otp_hash, purpose, attempts, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET attempts = EXCLUDED.attempts`,
      [otp.id, otp.email, otp.otpHash, otp.purpose, otp.attempts, otp.expiresAt, otp.createdAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] saveOtp error:', err.message);
    return false;
  }
}

export async function deleteOtpFromNeon(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query('DELETE FROM otp_verifications WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon DB] deleteOtp error:', err.message);
    return false;
  }
}

export async function logAuditToNeon(entry: AuditLog): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, user_email, institution_id, action, category, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        entry.id,
        entry.userId || null,
        entry.userEmail || null,
        entry.institutionId || null,
        entry.action,
        entry.category,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null,
        entry.timestamp,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] logAudit error:', err.message);
    return false;
  }
}

// ----------------------------------------------------------------------------
// EXISTING SYNC & DOUBTS QUEUE METHODS (PRESERVED)
// ----------------------------------------------------------------------------

export async function insertSyncEvent(ev: {
  eventId: string;
  learnerId: string;
  questionId: string;
  skillId: string;
  chosenAnswer: string;
  correct: boolean;
  hintsUsed?: number;
  timeMs?: number;
  inputMode?: string;
  receiptHash?: string;
  ts: number;
}): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO sync_events (event_id, learner_id, question_id, skill_id, chosen_answer, correct, hints_used, time_ms, input_mode, receipt_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        ev.eventId,
        ev.learnerId,
        ev.questionId,
        ev.skillId,
        ev.chosenAnswer,
        ev.correct,
        ev.hintsUsed || 0,
        ev.timeMs || 0,
        ev.inputMode || 'tap',
        ev.receiptHash || null,
        ev.ts,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Neon DB] Error inserting sync event:', err);
    return false;
  }
}

export async function insertOrUpdateDoubt(doubt: {
  id: string;
  learnerId: string;
  topicId?: string;
  question: string;
  answer?: string;
  audioUrl?: string;
  photoUrl?: string;
  inputMode?: string;
  status: string;
  ts: number;
}): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO doubts_queue (id, learner_id, topic_id, question, answer, audio_url, photo_url, input_mode, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         answer = EXCLUDED.answer,
         audio_url = EXCLUDED.audio_url,
         status = EXCLUDED.status`,
      [
        doubt.id,
        doubt.learnerId,
        doubt.topicId || null,
        doubt.question,
        doubt.answer || null,
        doubt.audioUrl || null,
        doubt.photoUrl || null,
        doubt.inputMode || 'text',
        doubt.status,
        doubt.ts,
      ]
    );
    return true;
  } catch (err) {
    console.error('[Neon DB] Error inserting doubt:', err);
    return false;
  }
}

export async function saveLearningResourceToNeon(lr: LearningResource): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO learning_resources (id, subject_id, unit_id, topic_id, teacher_id, teacher_name, resource_type, title, description, file_url, content_text, video_url, meeting_url, scheduled_at, duration_mins, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         file_url = EXCLUDED.file_url,
         content_text = EXCLUDED.content_text`,
      [
        lr.id,
        lr.subjectId,
        lr.unitId || null,
        lr.topicId || null,
        lr.teacherId || null,
        lr.teacherName || null,
        lr.resourceType,
        lr.title,
        lr.description || null,
        lr.fileUrl || null,
        lr.contentText || null,
        lr.videoUrl || null,
        lr.meetingUrl || null,
        lr.scheduledAt || null,
        lr.durationMins || null,
        lr.createdAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving resource:', err.message);
    return false;
  }
}

export async function saveFamilyToNeon(fam: Family): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO families (id, name, primary_guardian_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         updated_at = EXCLUDED.updated_at`,
      [fam.id, fam.name, fam.primaryGuardianId, fam.createdAt, fam.updatedAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving family:', err.message);
    return false;
  }
}

export async function saveFamilyMemberToNeon(mem: FamilyMember): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO family_members (id, family_id, user_id, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [mem.id, mem.familyId, mem.userId, mem.role, mem.createdAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving family member:', err.message);
    return false;
  }
}

export async function saveGuardianshipToNeon(g: Guardianship): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO guardianships (id, guardian_id, student_id, relationship, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [g.id, g.guardianId, g.studentId, g.relationship, g.createdAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving guardianship:', err.message);
    return false;
  }
}

export async function saveCourseToNeon(c: Course): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO courses (id, code, title, institution_id, description, syllabus, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         syllabus = EXCLUDED.syllabus,
         updated_at = EXCLUDED.updated_at`,
      [
        c.id,
        c.code,
        c.title,
        c.institutionId,
        c.description || null,
        JSON.stringify(c.syllabus || []),
        c.createdAt,
        c.updatedAt,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving course:', err.message);
    return false;
  }
}

export async function saveCourseEnrollmentToNeon(ce: CourseEnrollment): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO course_enrollments (id, course_id, student_id, status, enrolled_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [ce.id, ce.courseId, ce.studentId, ce.status, ce.enrolledAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving course enrollment:', err.message);
    return false;
  }
}

export async function saveAiConversationToNeon(ac: AiConversation): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO ai_conversations (id, student_id, topic_id, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
      [ac.id, ac.studentId, ac.topicId || null, ac.language, ac.createdAt, ac.updatedAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving conversation:', err.message);
    return false;
  }
}

export async function saveAiMessageToNeon(am: AiMessage): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO ai_messages (id, conversation_id, sender, text, audio_url, photo_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [am.id, am.conversationId, am.sender, am.text, am.audioUrl || null, am.photoUrl || null, am.createdAt]
    );
    return true;
  } catch (err: any) {
    console.error('[Neon DB] Error saving message:', err.message);
    return false;
  }
}
