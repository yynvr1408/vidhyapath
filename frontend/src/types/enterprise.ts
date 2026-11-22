// Enterprise Educational Platform Domain Types for Vidyapath

export type UserRole =
  | 'super_admin'         // Level 1: Platform Super Administrator
  | 'institution_admin'   // Level 2: Institution Administrator
  | 'academic_admin'      // Level 3: Department Head / Academic Admin
  | 'teacher'             // Level 4: Faculty / Teacher
  | 'student'             // Level 5: Student / Learner
  | 'guardian'            // Additional: Parent / Guardian
  | 'coordinator'         // Additional: Academic Coordinator
  | 'exam_admin';         // Additional: Examination Administrator

export type InstitutionStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type UserStatus = 'pending_verification' | 'active' | 'suspended';

export interface Institution {
  id: string;
  name: string;
  code: string; // e.g. "AIT-2026", "ZPHS-CHITTOOR"
  type: 'university' | 'college' | 'school' | 'polytechnic';
  address: string;
  contactEmail: string;
  contactPhone: string;
  status: InstitutionStatus;
  rejectionReason?: string;
  websiteUrl?: string;
  logoUrl?: string;
  academicYears: AcademicYear[];
  aiPolicy: AiSafetyPolicy;
  createdAt: number;
  approvedAt?: number;
}

export interface AcademicYear {
  id: string;
  institutionId: string;
  yearLabel: string; // e.g. "2025-2026"
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface Department {
  id: string;
  institutionId: string;
  name: string; // e.g. "Computer Science & Engineering", "Mathematics"
  code: string; // e.g. "CSE", "MATHS"
  hodUserId?: string;
  hodName?: string;
  createdAt: number;
}

export interface Programme {
  id: string;
  institutionId: string;
  departmentId: string;
  name: string; // e.g. "B.Tech in Computer Science", "Class 10 High School"
  code: string; // e.g. "BTECH-CSE", "CLASS-10"
  degreeType: 'B.Tech' | 'B.Sc' | 'M.Tech' | 'Diploma' | 'Secondary' | 'Higher Secondary';
  totalSemesters: number; // e.g. 8 for B.Tech, 2 for Class 10
  createdAt: number;
}

export interface CurriculumTopic {
  id: string;
  unitId: string;
  topicNumber: number;
  title: string;
  description: string;
  learningOutcomes: string[];
  referenceMaterials: string[];
  estimatedMinutes?: number;
}

export interface CurriculumUnit {
  id: string;
  subjectId: string;
  unitNumber: number;
  title: string;
  description: string;
  topics: CurriculumTopic[];
}

export interface Subject {
  id: string;
  institutionId: string;
  departmentId: string;
  programmeId: string;
  semester: number; // 1, 2, 3, ...
  name: string; // e.g. "Data Structures & Algorithms", "Mathematics"
  code: string; // e.g. "CS301", "MTH10"
  credits: number;
  description: string;
  syllabusVersion: string; // e.g. "R23-v1.2"
  isPublished: boolean;
  assignedTeacherIds: string[];
  units: CurriculumUnit[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  institutionId?: string;
  institutionName?: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: number;
  lastLoginAt?: number;
  // Specific profile links
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
}

export interface StudentProfile {
  userId: string;
  institutionId: string;
  departmentId: string;
  programmeId: string;
  admissionYear: string; // e.g. "2024"
  semester: number; // e.g. 5
  rollNumber: string; // e.g. "24IT042"
  classGrade?: number; // 1 to 10 (or 11, 12)
  board?: string; // 'CBSE' | 'State SSC'
  state?: string; // e.g. 'Andhra Pradesh', 'Telangana', etc.
  isIndependent?: boolean; // True for independent home learners
  guardianId?: string;
  securityQuestionId?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  registrationCode?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  attendancePercent?: number;
  completedTopicIds: string[];
}

export interface TeacherProfile {
  userId: string;
  institutionId: string;
  departmentId: string;
  designation: string; // e.g. "Associate Professor", "Head of Dept"
  qualifications: string; // e.g. "M.Tech, Ph.D"
  assignedSubjectIds: string[];
}

export interface LearningResource {
  id: string;
  subjectId: string;
  unitId: string;
  topicId?: string;
  teacherId: string;
  teacherName: string;
  resourceType: 'note' | 'pdf' | 'recorded_lecture' | 'live_class' | 'past_paper';
  title: string;
  description: string;
  fileUrl?: string;
  contentText?: string;
  videoUrl?: string;
  meetingUrl?: string; // For live classes (e.g. Google Meet / Jitsi link)
  scheduledAt?: number;
  durationMins?: number;
  createdAt: number;
}

export interface Assignment {
  id: string;
  subjectId: string;
  unitId?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: number;
  maxMarks: number;
  submissionsCount?: number;
  createdAt: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  contentText: string;
  fileUrl?: string;
  status: 'draft' | 'submitted' | 'graded';
  marksObtained?: number;
  feedback?: string;
  submittedAt: number;
  gradedAt?: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[]; // 4 options
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation?: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  unitId?: string;
  teacherId: string;
  title: string;
  timeLimitMinutes: number;
  passPercentage: number;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  selectedAnswers: number[];
  completedAt: number;
}

export interface Announcement {
  id: string;
  institutionId: string;
  departmentId?: string;
  subjectId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  targetRole: 'all' | 'teachers' | 'students';
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'academic' | 'assignment' | 'exam' | 'security' | 'announcement';
  read: boolean;
  actionUrl?: string;
  createdAt: number;
}

export interface AiSafetyPolicy {
  institutionId: string;
  maxDailyQueriesStudent: number;
  blockExamKeywords: boolean;
  requireSyllabusGrounding: boolean;
  auditLoggingEnabled: boolean;
  allowedKeywords?: string[];
  blockedKeywords?: string[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  institutionId?: string;
  action: string;
  category: 'auth' | 'admin' | 'academic' | 'ai_guardrail' | 'security';
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: number;
}

export interface OtpRecord {
  id: string;
  email: string;
  otpHash: string;
  purpose: 'registration' | 'login' | 'password_reset' | 'email_verification';
  attempts: number;
  expiresAt: number;
  createdAt: number;
}

export interface Family {
  id: string;
  name: string;
  primaryGuardianId: string;
  createdAt: number;
  updatedAt: number;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: 'guardian' | 'student';
  createdAt: number;
}

export interface Guardianship {
  id: string;
  guardianId: string;
  studentId: string;
  relationship: string;
  createdAt: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  institutionId: string;
  scope?: 'global' | 'institution';
  classGrade?: number; // 1 to 10 (Mandatory Free) or 11+ (Institution Paid Plans)
  board?: string; // 'CBSE' | 'State SSC'
  state?: string; // e.g. 'Andhra Pradesh', 'Telangana', 'Maharashtra'
  subjectName?: string;
  language?: string; // 'te' | 'hi' | 'en'
  isFree?: boolean; // Guaranteed true for classGrade <= 10
  feeAmount?: number; // 0 for classGrade <= 10
  feeCurrency?: string;
  description?: string;
  syllabus?: any[];
  createdAt: number;
  updatedAt: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: 'active' | 'completed' | 'dropped' | 'pending_payment';
  feePaid?: number;
  paymentReference?: string;
  enrolledAt: number;
}

export interface AiConversation {
  id: string;
  studentId: string;
  topicId?: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  sender: 'student' | 'tutor';
  text: string;
  audioUrl?: string;
  photoUrl?: string;
  createdAt: number;
}
