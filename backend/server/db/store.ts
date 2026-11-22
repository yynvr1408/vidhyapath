// Central Data Store for Vidyapath Enterprise Educational Platform
import '../env.js';
import crypto from 'crypto';
import {
  Institution,
  User,
  Department,
  Programme,
  AcademicYear,
  Subject,
  CurriculumUnit,
  CurriculumTopic,
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
  UserRole,
  Family,
  FamilyMember,
  Guardianship,
  Course,
  CourseEnrollment,
  AiConversation,
  AiMessage,
} from '../types/enterprise.js';

function safeHexEqual(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export type StoreSyncListeners = {
  onSaveInstitution?: (inst: Institution) => void;
  onSaveUser?: (user: any) => void;
  onSaveSubject?: (subj: Subject) => void;
  onSaveAssignment?: (a: Assignment) => void;
  onSaveSubmission?: (sub: AssignmentSubmission) => void;
  onSaveQuiz?: (q: Quiz) => void;
  onSaveQuizAttempt?: (att: QuizAttempt) => void;
  onSaveAnnouncement?: (ann: Announcement) => void;
  onSaveNotification?: (notif: NotificationItem) => void;
  onSaveOtp?: (otp: OtpRecord) => void;
  onSaveLearningResource?: (lr: LearningResource) => void;
  onSaveFamily?: (fam: Family) => void;
  onSaveFamilyMember?: (mem: FamilyMember) => void;
  onSaveGuardianship?: (g: Guardianship) => void;
  onSaveCourse?: (c: Course) => void;
  onSaveCourseEnrollment?: (ce: CourseEnrollment) => void;
  onSaveAiConversation?: (ac: AiConversation) => void;
  onSaveAiMessage?: (am: AiMessage) => void;
  onLogAudit?: (entry: AuditLog) => void;
};

class ObservableMap<K, V> extends Map<K, V> {
  private onSet?: (value: V) => void;
  constructor(onSet?: (value: V) => void) {
    super();
    this.onSet = onSet;
  }
  override set(key: K, value: V): this {
    super.set(key, value);
    if (this.onSet) {
      try {
        this.onSet(value);
      } catch (_) {}
    }
    return this;
  }
}

class InMemoryDataStore {
  syncListeners: StoreSyncListeners = {};

  institutions: Map<string, Institution> = new ObservableMap<string, Institution>((v) => this.syncListeners.onSaveInstitution?.(v));
  users: Map<string, User & { passwordHash: string; salt: string }> = new ObservableMap((v) => this.syncListeners.onSaveUser?.(v));
  departments: Map<string, Department> = new Map();
  programmes: Map<string, Programme> = new Map();
  academicYears: Map<string, AcademicYear> = new Map();
  subjects: Map<string, Subject> = new ObservableMap<string, Subject>((v) => this.syncListeners.onSaveSubject?.(v));
  learningResources: Map<string, LearningResource> = new ObservableMap<string, LearningResource>((v) => this.syncListeners.onSaveLearningResource?.(v));
  assignments: Map<string, Assignment> = new ObservableMap<string, Assignment>((v) => this.syncListeners.onSaveAssignment?.(v));
  submissions: Map<string, AssignmentSubmission> = new ObservableMap<string, AssignmentSubmission>((v) => this.syncListeners.onSaveSubmission?.(v));
  quizzes: Map<string, Quiz> = new ObservableMap<string, Quiz>((v) => this.syncListeners.onSaveQuiz?.(v));
  quizAttempts: Map<string, QuizAttempt> = new ObservableMap<string, QuizAttempt>((v) => this.syncListeners.onSaveQuizAttempt?.(v));
  announcements: Map<string, Announcement> = new ObservableMap<string, Announcement>((v) => this.syncListeners.onSaveAnnouncement?.(v));
  notifications: Map<string, NotificationItem> = new ObservableMap<string, NotificationItem>((v) => this.syncListeners.onSaveNotification?.(v));
  otps: Map<string, OtpRecord> = new ObservableMap<string, OtpRecord>((v) => this.syncListeners.onSaveOtp?.(v));
  families: Map<string, Family> = new ObservableMap<string, Family>((v) => this.syncListeners.onSaveFamily?.(v));
  familyMembers: Map<string, FamilyMember> = new ObservableMap<string, FamilyMember>((v) => this.syncListeners.onSaveFamilyMember?.(v));
  guardianships: Map<string, Guardianship> = new ObservableMap<string, Guardianship>((v) => this.syncListeners.onSaveGuardianship?.(v));
  courses: Map<string, Course> = new ObservableMap<string, Course>((v) => this.syncListeners.onSaveCourse?.(v));
  courseEnrollments: Map<string, CourseEnrollment> = new ObservableMap<string, CourseEnrollment>((v) => this.syncListeners.onSaveCourseEnrollment?.(v));
  aiConversations: Map<string, AiConversation> = new ObservableMap<string, AiConversation>((v) => this.syncListeners.onSaveAiConversation?.(v));
  aiMessages: Map<string, AiMessage> = new ObservableMap<string, AiMessage>((v) => this.syncListeners.onSaveAiMessage?.(v));
  auditLogs: AuditLog[] = [];
  aiPolicies: Map<string, AiSafetyPolicy> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  registerSyncListeners(listeners: StoreSyncListeners) {
    this.syncListeners = { ...this.syncListeners, ...listeners };
  }

  // Password hashing helper (10,000 PBKDF2 iterations)
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed10k = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    if (safeHexEqual(computed10k, hash)) return true;
    const computed1k = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return safeHexEqual(computed1k, hash);
  }

  private seedDefaultData() {
    // Internal tenant used by independent learner enrollment. Real contact data
    // is configured by operators when institutions join the platform.
    const instGlobal: Institution = {
      id: 'inst_global',
      name: 'Independent Learning',
      code: 'INDEPENDENT',
      type: 'school',
      address: '',
      contactEmail: '',
      contactPhone: '',
      status: 'approved',
      academicYears: [
        {
          id: 'ay_global_2025_2026',
          institutionId: 'inst_global',
          yearLabel: '2025-2026',
          isCurrent: true,
          startDate: '2025-06-01',
          endDate: '2026-05-31',
        },
      ],
      aiPolicy: {
        institutionId: 'inst_global',
        maxDailyQueriesStudent: 50,
        blockExamKeywords: false,
        requireSyllabusGrounding: true,
        auditLoggingEnabled: true,
      },
      createdAt: Date.now(),
    };
    this.institutions.set(instGlobal.id, instGlobal);

    // An administrator is created only when an operator explicitly configures
    // a bootstrap account. Production never receives shared default credentials.
    const bootstrapEmail = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const bootstrapPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;
    if (bootstrapEmail && bootstrapPassword && bootstrapPassword.length >= 12) {
      const pwd = this.hashPassword(bootstrapPassword);
      const user: User & { passwordHash: string; salt: string } = {
        id: 'user_super_admin',
        fullName: process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || 'Platform Administrator',
        email: bootstrapEmail,
        role: 'super_admin',
        status: 'active',
        passwordHash: pwd.hash,
        salt: pwd.salt,
        createdAt: Date.now(),
      };
      this.users.set(user.id, user);
    }
  }

  // Audit Logger
  logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      ...log,
      id: 'audit_' + crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.syncListeners.onLogAudit?.(entry);
    return entry;
  }
}

export const dataStore = new InMemoryDataStore();
