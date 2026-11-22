import { dataStore } from '../../backend/server/db/store.js';
import { AuthService } from '../../backend/server/services/auth.js';
import type { Institution, User, UserRole } from '../../backend/server/types/enterprise.js';

export const TEST_INSTITUTION_ID = 'inst_test_suite';

export function ensureTestInstitution(institutionId = TEST_INSTITUTION_ID) {
  if (!dataStore.institutions.has(institutionId)) {
    const institution: Institution = {
      id: institutionId,
      name: 'Isolated Test Institution',
      code: institutionId.toUpperCase(),
      type: 'college',
      address: '',
      contactEmail: 'test@example.invalid',
      contactPhone: '',
      status: 'approved',
      academicYears: [],
      aiPolicy: { institutionId, maxDailyQueriesStudent: 30, blockExamKeywords: true, requireSyllabusGrounding: true, auditLoggingEnabled: true },
      createdAt: Date.now(),
    };
    dataStore.institutions.set(institutionId, institution);
  }
  return dataStore.institutions.get(institutionId)!;
}

export function createTestAccount(role: UserRole, id: string, institutionId = TEST_INSTITUTION_ID) {
  if (role !== 'super_admin') ensureTestInstitution(institutionId);
  const user: User & { passwordHash: string; salt: string } = {
    id,
    fullName: `Test ${role}`,
    email: `${id}@example.invalid`,
    institutionId: role === 'super_admin' ? undefined : institutionId,
    institutionName: role === 'super_admin' ? undefined : dataStore.institutions.get(institutionId)?.name,
    role,
    status: 'active',
    passwordHash: 'fixture-only',
    salt: 'fixture-only',
    createdAt: Date.now(),
    ...(role === 'student' ? {
      studentProfile: {
        userId: id, institutionId, departmentId: 'dept_test', programmeId: 'prog_test', admissionYear: '2026', semester: 1,
        rollNumber: `TEST-${id.toUpperCase()}`, classGrade: 10, completedTopicIds: [],
      },
    } : {}),
    ...(role === 'teacher' ? {
      teacherProfile: { userId: id, institutionId, departmentId: 'dept_test', designation: 'Test Teacher', qualifications: '', assignedSubjectIds: [] },
    } : {}),
  };
  dataStore.users.set(id, user);
  return { user, token: AuthService.generateToken(user) };
}

export function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}` };
}
