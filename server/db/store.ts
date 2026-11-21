// Central Data Store for Vidyapath Enterprise Educational Platform
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
  UserRole
} from '../../src/types/enterprise.js';

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
  learningResources: Map<string, LearningResource> = new Map();
  assignments: Map<string, Assignment> = new ObservableMap<string, Assignment>((v) => this.syncListeners.onSaveAssignment?.(v));
  submissions: Map<string, AssignmentSubmission> = new ObservableMap<string, AssignmentSubmission>((v) => this.syncListeners.onSaveSubmission?.(v));
  quizzes: Map<string, Quiz> = new ObservableMap<string, Quiz>((v) => this.syncListeners.onSaveQuiz?.(v));
  quizAttempts: Map<string, QuizAttempt> = new ObservableMap<string, QuizAttempt>((v) => this.syncListeners.onSaveQuizAttempt?.(v));
  announcements: Map<string, Announcement> = new ObservableMap<string, Announcement>((v) => this.syncListeners.onSaveAnnouncement?.(v));
  notifications: Map<string, NotificationItem> = new ObservableMap<string, NotificationItem>((v) => this.syncListeners.onSaveNotification?.(v));
  otps: Map<string, OtpRecord> = new ObservableMap<string, OtpRecord>((v) => this.syncListeners.onSaveOtp?.(v));
  auditLogs: AuditLog[] = [];
  aiPolicies: Map<string, AiSafetyPolicy> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  registerSyncListeners(listeners: StoreSyncListeners) {
    this.syncListeners = { ...this.syncListeners, ...listeners };
  }

  // Password hashing helper
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return computed === hash;
  }

  private seedDefaultData() {
    // 1. Approved Institution: Apex Institute of Technology
    const instAit: Institution = {
      id: 'inst_ait_hyd',
      name: 'Apex Institute of Engineering & Technology',
      code: 'AIT-HYD',
      type: 'college',
      address: 'Gachibowli Tech Corridor, Hyderabad, Telangana 500032',
      contactEmail: 'contact@apextech.edu',
      contactPhone: '+91-40-2345-6789',
      status: 'approved',
      websiteUrl: 'https://apextech.edu',
      academicYears: [
        {
          id: 'ay_2025_2026',
          institutionId: 'inst_ait_hyd',
          yearLabel: '2025-2026',
          isCurrent: true,
          startDate: '2025-07-01',
          endDate: '2026-05-31',
        },
      ],
      aiPolicy: {
        institutionId: 'inst_ait_hyd',
        maxDailyQueriesStudent: 30,
        blockExamKeywords: true,
        requireSyllabusGrounding: true,
        auditLoggingEnabled: true,
      },
      createdAt: Date.now() - 60 * 24 * 3600 * 1000,
      approvedAt: Date.now() - 55 * 24 * 3600 * 1000,
    };
    this.institutions.set(instAit.id, instAit);

    // 2. Pending Institution: Govt Zilla Parishad High School, Nellore
    const instZphs: Institution = {
      id: 'inst_zphs_nellore',
      name: 'Govt Zilla Parishad High School, Nellore',
      code: 'ZPHS-NEL',
      type: 'school',
      address: 'Kovur Road, Nellore, Andhra Pradesh 524001',
      contactEmail: 'headmaster.nellore@zphs.edu',
      contactPhone: '+91-861-232-4411',
      status: 'pending',
      websiteUrl: 'https://schools.ap.gov.in/nellore',
      academicYears: [],
      aiPolicy: {
        institutionId: 'inst_zphs_nellore',
        maxDailyQueriesStudent: 20,
        blockExamKeywords: true,
        requireSyllabusGrounding: true,
        auditLoggingEnabled: true,
      },
      createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    };
    this.institutions.set(instZphs.id, instZphs);

    // 3. Departments
    const deptCse: Department = {
      id: 'dept_cse',
      institutionId: 'inst_ait_hyd',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      hodUserId: 'user_hod_cse',
      hodName: 'Dr. Sunita Rao',
      createdAt: Date.now() - 50 * 24 * 3600 * 1000,
    };
    this.departments.set(deptCse.id, deptCse);

    const deptMaths: Department = {
      id: 'dept_maths',
      institutionId: 'inst_ait_hyd',
      name: 'Department of Mathematics & Sciences',
      code: 'MTH',
      hodUserId: 'user_hod_maths',
      hodName: 'Prof. P. Ramachandran',
      createdAt: Date.now() - 50 * 24 * 3600 * 1000,
    };
    this.departments.set(deptMaths.id, deptMaths);

    // 4. Programmes
    const progBtechCse: Programme = {
      id: 'prog_btech_cse',
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_cse',
      name: 'B.Tech in Computer Science & Engineering',
      code: 'BTECH-CSE',
      degreeType: 'B.Tech',
      totalSemesters: 8,
      createdAt: Date.now() - 50 * 24 * 3600 * 1000,
    };
    this.programmes.set(progBtechCse.id, progBtechCse);

    // 5. Semester 5 Subjects for B.Tech CSE
    const subjOs: Subject = {
      id: 'subj_cs501',
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_cse',
      programmeId: 'prog_btech_cse',
      semester: 5,
      name: 'Operating Systems & Architecture',
      code: 'CS501',
      credits: 4,
      description: 'Core concepts of modern operating systems: process management, CPU scheduling, synchronization, deadlocks, virtual memory, and storage management.',
      syllabusVersion: 'R23-v1.2 (AICTE Approved)',
      isPublished: true,
      assignedTeacherIds: ['user_teacher_anil'],
      createdAt: Date.now() - 40 * 24 * 3600 * 1000,
      updatedAt: Date.now() - 10 * 24 * 3600 * 1000,
      units: [
        {
          id: 'unit_os_1',
          subjectId: 'subj_cs501',
          unitNumber: 1,
          title: 'Unit 1: Process Management & CPU Scheduling',
          description: 'Introduction to operating system structure, dual-mode operation, system calls, process state transitions, PCB, context switching, and CPU scheduling algorithms.',
          topics: [
            {
              id: 'top_os_1_1',
              unitId: 'unit_os_1',
              topicNumber: 1,
              title: 'Operating System Structure & Dual-Mode Operations',
              description: 'Kernel architecture, user vs kernel mode, privileged instructions, hardware protection.',
              learningOutcomes: [
                'Differentiate between user mode and kernel mode',
                'Understand system call dispatching via software interrupts',
              ],
              referenceMaterials: ['Silberschatz OS Concepts 10th Ed, Ch 1 & 2', 'Tanenbaum Modern OS, Ch 1'],
            },
            {
              id: 'top_os_1_2',
              unitId: 'unit_os_1',
              topicNumber: 2,
              title: 'Process Concept, States & Context Switching',
              description: 'Process Control Block (PCB), ready-running-waiting state diagram, dispatch latency, IPC.',
              learningOutcomes: [
                'Trace process lifecycle across ready, running, and waiting queues',
                'Calculate context switch overhead',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 3'],
            },
            {
              id: 'top_os_1_3',
              unitId: 'unit_os_1',
              topicNumber: 3,
              title: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin, Priority)',
              description: 'Preemptive vs non-preemptive scheduling, Gantt chart construction, waiting time & turnaround time calculation.',
              learningOutcomes: [
                'Construct Gantt charts for FCFS, SJF, and Round Robin scheduling',
                'Calculate average turnaround time and average waiting time accurately',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 5', 'MIT 6.004 CPU Scheduling Notes'],
            },
          ],
        },
        {
          id: 'unit_os_2',
          subjectId: 'subj_cs501',
          unitNumber: 2,
          title: 'Unit 2: Process Synchronization & Deadlocks',
          description: 'Critical section problem, Peterson algorithm, hardware atomic operations, counting and binary semaphores, classic synchronization problems (Dining Philosophers, Producer-Consumer), Banker algorithm for deadlock avoidance.',
          topics: [
            {
              id: 'top_os_2_1',
              unitId: 'unit_os_2',
              topicNumber: 1,
              title: 'The Critical Section Problem & Semaphores',
              description: 'Mutual exclusion, progress, bounded waiting. Mutex locks and semaphore wait()/signal() operations.',
              learningOutcomes: [
                'Implement mutual exclusion using semaphores',
                'Avoid race conditions and priority inversion',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 6 & 7'],
            },
            {
              id: 'top_os_2_2',
              unitId: 'unit_os_2',
              topicNumber: 2,
              title: 'Deadlock Characterization & Banker Algorithm',
              description: 'Four necessary conditions for deadlock (mutual exclusion, hold and wait, no preemption, circular wait). Safe state calculation using Banker algorithm.',
              learningOutcomes: [
                'Identify deadlock conditions in resource allocation graphs',
                'Execute Banker algorithm matrices (Max, Allocation, Need, Available) to find safe sequences',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 8'],
            },
          ],
        },
        {
          id: 'unit_os_3',
          subjectId: 'subj_cs501',
          unitNumber: 3,
          title: 'Unit 3: Memory Management & Virtual Memory',
          description: 'Logical vs physical address space, contiguous memory allocation, paging hardware, TLB translation, page replacement algorithms (FIFO, Optimal, LRU), thrashing.',
          topics: [
            {
              id: 'top_os_3_1',
              unitId: 'unit_os_3',
              topicNumber: 1,
              title: 'Paging Hardware & Translation Lookaside Buffer (TLB)',
              description: 'Page table structure, page frame mapping, TLB hit ratio and effective access time (EAT).',
              learningOutcomes: [
                'Calculate Effective Access Time (EAT) given TLB hit ratio and access penalties',
                'Understand multi-level paging memory overhead',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 9'],
            },
            {
              id: 'top_os_3_2',
              unitId: 'unit_os_3',
              topicNumber: 2,
              title: 'Page Replacement Algorithms & Thrashing Prevention',
              description: 'Page fault service routine, FIFO anomaly (Belady), LRU stack implementation, working set model.',
              learningOutcomes: [
                'Compute page fault count for reference strings under FIFO, Optimal, and LRU',
                'Explain thrashing causes and working set strategy',
              ],
              referenceMaterials: ['Silberschatz OS Concepts, Ch 10'],
            },
          ],
        },
      ],
    };
    this.subjects.set(subjOs.id, subjOs);

    const subjCn: Subject = {
      id: 'subj_cs502',
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_cse',
      programmeId: 'prog_btech_cse',
      semester: 5,
      name: 'Computer Networks & Protocols',
      code: 'CS502',
      credits: 4,
      description: 'Layered communication models, TCP/IP protocol suite, subnetting, sliding window protocols, routing algorithms (Dijkstra, Distance Vector), and transport flow control.',
      syllabusVersion: 'R23-v1.0',
      isPublished: true,
      assignedTeacherIds: ['user_teacher_anil'],
      createdAt: Date.now() - 40 * 24 * 3600 * 1000,
      updatedAt: Date.now() - 10 * 24 * 3600 * 1000,
      units: [
        {
          id: 'unit_cn_1',
          subjectId: 'subj_cs502',
          unitNumber: 1,
          title: 'Unit 1: Data Link Layer & Framing',
          description: 'Framing, error detection (CRC), flow control, sliding window protocols (Stop-and-Wait, Go-Back-N, Selective Repeat).',
          topics: [
            {
              id: 'top_cn_1_1',
              unitId: 'unit_cn_1',
              topicNumber: 1,
              title: 'Error Detection & CRC Generation',
              description: 'Polynomial division, CRC checksum calculation, Hamming distance.',
              learningOutcomes: ['Calculate CRC checksums for arbitrary bitstreams'],
              referenceMaterials: ['Kurose & Ross Computer Networking 8th Ed, Ch 5'],
            },
          ],
        },
      ],
    };
    this.subjects.set(subjCn.id, subjCn);

    const subjDbms: Subject = {
      id: 'subj_cs503',
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_cse',
      programmeId: 'prog_btech_cse',
      semester: 5,
      name: 'Database Management Systems',
      code: 'CS503',
      credits: 3,
      description: 'Relational algebra, SQL, ER modeling, Normalization (1NF through BCNF), ACID transaction properties, concurrency control, and indexing.',
      syllabusVersion: 'R23-v1.0',
      isPublished: true,
      assignedTeacherIds: ['user_teacher_anil'],
      createdAt: Date.now() - 40 * 24 * 3600 * 1000,
      updatedAt: Date.now() - 10 * 24 * 3600 * 1000,
      units: [],
    };
    this.subjects.set(subjDbms.id, subjDbms);

    // 6. Users (All 5 Roles + Guardians)
    // Default shared password: "password123"
    const pwd = this.hashPassword('password123');

    // Level 1: Platform Super Admin
    const userSuperAdmin: User & { passwordHash: string; salt: string } = {
      id: 'user_super_admin',
      fullName: 'Dr. K. S. Murthy',
      email: 'admin@vidyapath.edu',
      phone: '+91-98765-00001',
      role: 'super_admin',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 90 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 1 * 3600 * 1000,
    };
    this.users.set(userSuperAdmin.id, userSuperAdmin);

    // Level 2: Institution Admin
    const userInstAdmin: User & { passwordHash: string; salt: string } = {
      id: 'user_inst_admin',
      institutionId: 'inst_ait_hyd',
      institutionName: 'Apex Institute of Engineering & Technology',
      fullName: 'Prof. R. Venkatesh',
      email: 'principal@apextech.edu',
      phone: '+91-98765-00002',
      role: 'institution_admin',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 60 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 4 * 3600 * 1000,
    };
    this.users.set(userInstAdmin.id, userInstAdmin);

    // Level 3: Academic Admin / HOD
    const userHodCse: User & { passwordHash: string; salt: string } = {
      id: 'user_hod_cse',
      institutionId: 'inst_ait_hyd',
      institutionName: 'Apex Institute of Engineering & Technology',
      fullName: 'Dr. Sunita Rao',
      email: 'hod.cse@apextech.edu',
      phone: '+91-98765-00003',
      role: 'academic_admin',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 50 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 8 * 3600 * 1000,
    };
    this.users.set(userHodCse.id, userHodCse);

    // Level 4: Teacher / Faculty
    const userTeacherAnil: User & { passwordHash: string; salt: string } = {
      id: 'user_teacher_anil',
      institutionId: 'inst_ait_hyd',
      institutionName: 'Apex Institute of Engineering & Technology',
      fullName: 'Prof. Anil Kumar',
      email: 'anil.kumar@apextech.edu',
      phone: '+91-98765-00004',
      role: 'teacher',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 45 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 2 * 3600 * 1000,
      teacherProfile: {
        userId: 'user_teacher_anil',
        institutionId: 'inst_ait_hyd',
        departmentId: 'dept_cse',
        designation: 'Associate Professor',
        qualifications: 'M.Tech, Ph.D (System Architecture)',
        assignedSubjectIds: ['subj_cs501', 'subj_cs502'],
      },
    };
    this.users.set(userTeacherAnil.id, userTeacherAnil);

    // Level 5: Student (Aditya Verma - 5th Semester B.Tech CSE)
    const userStudentAditya: User & { passwordHash: string; salt: string } = {
      id: 'user_student_aditya',
      institutionId: 'inst_ait_hyd',
      institutionName: 'Apex Institute of Engineering & Technology',
      fullName: 'Aditya Verma',
      email: 'aditya.23cs042@apextech.edu',
      phone: '+91-98765-00005',
      role: 'student',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 30 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 30 * 60 * 1000,
      studentProfile: {
        userId: 'user_student_aditya',
        institutionId: 'inst_ait_hyd',
        departmentId: 'dept_cse',
        programmeId: 'prog_btech_cse',
        admissionYear: '2023',
        semester: 5,
        rollNumber: '23CS042',
        registrationCode: 'AIT-23CS042',
        guardianEmail: 'm.verma.parent@gmail.com',
        guardianPhone: '+91-98765-00006',
        attendancePercent: 91,
        completedTopicIds: ['top_os_1_1', 'top_os_1_2'],
      },
    };
    this.users.set(userStudentAditya.id, userStudentAditya);

    // Additional Role: Guardian
    const userGuardianVerma: User & { passwordHash: string; salt: string } = {
      id: 'user_guardian_verma',
      institutionId: 'inst_ait_hyd',
      institutionName: 'Apex Institute of Engineering & Technology',
      fullName: 'Mohan Verma (Guardian)',
      email: 'm.verma.parent@gmail.com',
      phone: '+91-98765-00006',
      role: 'guardian',
      status: 'active',
      passwordHash: pwd.hash,
      salt: pwd.salt,
      createdAt: Date.now() - 25 * 24 * 3600 * 1000,
      lastLoginAt: Date.now() - 24 * 3600 * 1000,
    };
    this.users.set(userGuardianVerma.id, userGuardianVerma);

    // 7. Learning Resources for Operating Systems (CS501)
    const resNote1: LearningResource = {
      id: 'res_note_os_1',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_1',
      topicId: 'top_os_1_3',
      teacherId: 'user_teacher_anil',
      teacherName: 'Prof. Anil Kumar',
      resourceType: 'note',
      title: 'Complete CPU Scheduling Algorithms Summary & Solved Numerical Problems',
      description: 'Comprehensive step-by-step worked examples on Gantt chart calculations for FCFS, Shortest Job First (SJF Non-preemptive and Preemptive/SRTF), and Round Robin with quantum q=2ms.',
      contentText: `# CPU Scheduling Summary & Cheat Sheet\n\n## 1. Key Metrics\n- **Turnaround Time (TAT)** = Completion Time - Arrival Time\n- **Waiting Time (WT)** = Turnaround Time - Burst Time\n- **Response Time** = First CPU allocation time - Arrival Time\n\n## 2. Solved Example (Round Robin with q=2ms)\n| Process | AT | BT |\n| P1 | 0 | 5 |\n| P2 | 1 | 3 |\n| P3 | 2 | 1 |\n\n**Gantt Chart:**\n[0--P1--2][2--P2--4][4--P3--5][5--P1--7][7--P2--8][8--P1--9]\n\n**Calculated Averages:**\n- Average Turnaround Time = (9 + 7 + 3) / 3 = 6.33 ms\n- Average Waiting Time = (4 + 4 + 2) / 3 = 3.33 ms`,
      createdAt: Date.now() - 14 * 24 * 3600 * 1000,
    };
    this.learningResources.set(resNote1.id, resNote1);

    const resPdf1: LearningResource = {
      id: 'res_pdf_os_2',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_2',
      topicId: 'top_os_2_2',
      teacherId: 'user_teacher_anil',
      teacherName: 'Prof. Anil Kumar',
      resourceType: 'pdf',
      title: 'Unit 2: Banker Algorithm for Deadlock Avoidance - Handout & Proofs',
      description: 'Official lecture handout covering Safety Algorithm and Resource-Request Algorithm with sample 5-process allocation matrices.',
      fileUrl: '/assets/docs/Unit2_Deadlock_Banker_Handout.pdf',
      createdAt: Date.now() - 10 * 24 * 3600 * 1000,
    };
    this.learningResources.set(resPdf1.id, resPdf1);

    const resVideo1: LearningResource = {
      id: 'res_video_os_1',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_2',
      topicId: 'top_os_2_1',
      teacherId: 'user_teacher_anil',
      teacherName: 'Prof. Anil Kumar',
      resourceType: 'recorded_lecture',
      title: 'Mastering Semaphores & Mutex Locks in 20 Minutes',
      description: 'Recorded classroom lecture explaining race condition prevention and POSIX semaphore functions sem_wait() and sem_post().',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      durationMins: 22,
      createdAt: Date.now() - 7 * 24 * 3600 * 1000,
    };
    this.learningResources.set(resVideo1.id, resVideo1);

    const resLive1: LearningResource = {
      id: 'res_live_os_1',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_1',
      teacherId: 'user_teacher_anil',
      teacherName: 'Prof. Anil Kumar',
      resourceType: 'live_class',
      title: 'Live Mid-Term Doubt Clearing & Problem Solving Session',
      description: 'Interactive session reviewing Unit 1 & Unit 2 numerical problems prior to the mid-term assessment.',
      meetingUrl: 'https://meet.jit.si/Vidyapath_AIT_OS_Live_Session',
      scheduledAt: Date.now() + 2 * 24 * 3600 * 1000, // in 2 days
      durationMins: 60,
      createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    };
    this.learningResources.set(resLive1.id, resLive1);

    // 8. Assignments
    const assign1: Assignment = {
      id: 'assign_os_1',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_1',
      teacherId: 'user_teacher_anil',
      teacherName: 'Prof. Anil Kumar',
      title: 'Assignment 1: CPU Scheduling Simulator & Performance Analysis',
      description: 'Implement or manually simulate FCFS, SJF, and Round Robin (q=2 and q=4) for the given process workload. Compare average waiting time, turnaround time, and CPU utilization.',
      instructions: 'Submit either your handwritten PDF solution or code repository link. Ensure you clearly show the Gantt chart for each algorithm.',
      dueDate: Date.now() + 5 * 24 * 3600 * 1000, // in 5 days
      maxMarks: 20,
      submissionsCount: 38,
      createdAt: Date.now() - 5 * 24 * 3600 * 1000,
    };
    this.assignments.set(assign1.id, assign1);

    // Sample submission for student Aditya
    const sub1: AssignmentSubmission = {
      id: 'sub_os_1_aditya',
      assignmentId: 'assign_os_1',
      studentId: 'user_student_aditya',
      studentName: 'Aditya Verma',
      contentText: 'Completed Gantt chart calculations and analysis for all 4 scheduling algorithms. Found that Round Robin (q=2) minimized average response time to 1.8ms, while SJF provided lowest overall waiting time.',
      fileUrl: '/uploads/aditya_os_assignment1.pdf',
      status: 'submitted',
      submittedAt: Date.now() - 1 * 24 * 3600 * 1000,
    };
    this.submissions.set(sub1.id, sub1);

    // 9. Quizzes
    const quiz1: Quiz = {
      id: 'quiz_os_1',
      subjectId: 'subj_cs501',
      unitId: 'unit_os_1',
      teacherId: 'user_teacher_anil',
      title: 'Unit 1 Mastery Quiz: CPU Scheduling & Process States',
      timeLimitMinutes: 15,
      passPercentage: 75,
      createdAt: Date.now() - 7 * 24 * 3600 * 1000,
      questions: [
        {
          id: 'q_os_1_1',
          text: 'Which CPU scheduling algorithm is guaranteed to produce the minimum average waiting time for a given set of processes?',
          options: ['First-Come, First-Served (FCFS)', 'Shortest-Job-First (SJF)', 'Round Robin (RR)', 'Priority Scheduling'],
          correctOptionIndex: 1,
          explanation: 'Shortest-Job-First (SJF) is provably optimal because assigning the CPU to the shortest job first minimizes the waiting time for all subsequent processes.',
        },
        {
          id: 'q_os_1_2',
          text: 'In the 5-state process model, what state transition occurs when a process requests I/O?',
          options: ['Running -> Ready', 'Running -> Waiting (Blocked)', 'Waiting -> Terminated', 'Ready -> Running'],
          correctOptionIndex: 1,
          explanation: 'When an active running process issues an I/O request, it cannot continue until the I/O completes, transitioning into the Waiting (Blocked) state.',
        },
        {
          id: 'q_os_1_3',
          text: 'What is the primary drawback of setting the Round Robin time quantum too small?',
          options: [
            'Processes starve indefinitely',
            'Context switch overhead consumes a significant fraction of CPU time',
            'Turnaround time increases exponentially for short processes',
            'System behaves identically to FCFS',
          ],
          correctOptionIndex: 1,
          explanation: 'If the quantum is too small (e.g. comparable to context-switch latency), CPU spends too much time saving and restoring registers rather than doing productive user work.',
        },
        {
          id: 'q_os_1_4',
          text: 'Which of the following is NOT stored inside a Process Control Block (PCB)?',
          options: [
            'Process State and Program Counter',
            'CPU Registers and Scheduling Information',
            'Memory-Management Information (Page tables)',
            'The entire operating system kernel code segment',
          ],
          correctOptionIndex: 3,
          explanation: 'The PCB contains process-specific metadata (state, registers, page tables, open files). The OS kernel code segment is shared globally and not stored in individual PCBs.',
        },
      ],
    };
    this.quizzes.set(quiz1.id, quiz1);

    // 10. Announcements
    const ann1: Announcement = {
      id: 'ann_1',
      institutionId: 'inst_ait_hyd',
      authorId: 'user_inst_admin',
      authorName: 'Prof. R. Venkatesh (Principal)',
      authorRole: 'institution_admin',
      title: 'Semester 5 Mid-Term Examination Schedule Announced',
      body: 'Mid-term examinations for B.Tech Semester 5 will commence from Monday, 1st December 2026. Official seating arrangements and hall tickets are accessible through your portal.',
      priority: 'urgent',
      targetRole: 'all',
      createdAt: Date.now() - 3 * 24 * 3600 * 1000,
    };
    this.announcements.set(ann1.id, ann1);

    const ann2: Announcement = {
      id: 'ann_2',
      institutionId: 'inst_ait_hyd',
      departmentId: 'dept_cse',
      subjectId: 'subj_cs501',
      authorId: 'user_teacher_anil',
      authorName: 'Prof. Anil Kumar',
      authorRole: 'teacher',
      title: 'Operating Systems: Unit 1 Assignment 1 & Review Class Link',
      body: 'Please review the Gantt chart summary notes before attempting Assignment 1. Our live problem solving session link is posted under Subject Live Classes.',
      priority: 'normal',
      targetRole: 'students',
      createdAt: Date.now() - 1 * 24 * 3600 * 1000,
    };
    this.announcements.set(ann2.id, ann2);

    // 11. Initial Notifications
    const notif1: NotificationItem = {
      id: 'notif_1',
      userId: 'user_student_aditya',
      title: 'New Assignment Published',
      message: 'Prof. Anil Kumar posted Assignment 1 in Operating Systems (CS501). Due date: 5 days.',
      type: 'assignment',
      read: false,
      actionUrl: '/subject/subj_cs501',
      createdAt: Date.now() - 1 * 3600 * 1000,
    };
    this.notifications.set(notif1.id, notif1);

    const notif2: NotificationItem = {
      id: 'notif_2',
      userId: 'user_student_aditya',
      title: 'Live Class Scheduled',
      message: 'Operating Systems Live Doubt Clearing Session scheduled for in 2 days at 10:00 AM.',
      type: 'academic',
      read: false,
      actionUrl: '/subject/subj_cs501',
      createdAt: Date.now() - 2 * 3600 * 1000,
    };
    this.notifications.set(notif2.id, notif2);

    const notifSuper: NotificationItem = {
      id: 'notif_super_1',
      userId: 'user_super_admin',
      title: 'Pending Institution Approval Request',
      message: 'Govt Zilla Parishad High School, Nellore has submitted a registration request for your review.',
      type: 'security',
      read: false,
      actionUrl: '/super-admin/institutions',
      createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    };
    this.notifications.set(notifSuper.id, notifSuper);
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
