# Vidyapath — Complete Implementation Roadmap

**Phased Execution Plan for Production Transformation**

---

## Phase Overview

| Phase | Domain | Core Objectives | Status |
|---|---|---|---|
| **Phase 1** | Audit & Architecture | Document codebase audit, schema, API architecture, and progress log | Complete |
| **Phase 2** | Database & Persistence | Re-engineer Neon PostgreSQL schema: Family, Courses, AI Conversations | In Progress |
| **Phase 3** | Authentication & Security | Unified authentication lifecycle, PBKDF2/Argon2id hashing, JWT, session revocation | In Progress |
| **Phase 4** | EmailJS Consolidation | Enforce strict 3-template architecture: Verification, Password Reset, Notifications | In Progress |
| **Phase 5** | Registration Pathways | Student, Parent, Family, Teacher, Institution, Independent Learner | In Progress |
| **Phase 6** | Family Management | Multiple student profiles per family, child switcher, separate AI histories | In Progress |
| **Phase 7** | L1 Super Admin | Real database statistics, institution approvals, global course publishing | In Progress |
| **Phase 8** | L2 Institution Admin | Direct academic administration (no separate HOD), departments, classes, subjects | In Progress |
| **Phase 9** | L3 Teacher & L4 Student | Class assignments, quiz grading, student learning portal | In Progress |
| **Phase 10** | Course & Curriculum Engine | Global $\to$ Institution course adoption, syllabus progression, RAG indexing | In Progress |
| **Phase 11** | Socratic AI Tutor | Retrieval-Augmented Generation, separate student conversation history, guardrails | In Progress |
| **Phase 12** | L5 Parent Dashboard | Child switcher, progress metrics, attendance, teacher notes | In Progress |
| **Phase 13** | Offline & Sync | IndexedDB offline cache, Service Worker, idempotent sync events | In Progress |
| **Phase 14** | Mobile & UI/UX | Sticky bottom navigation bar, touch targets $\ge 52$px, Android hardware back button | In Progress |
| **Phase 15** | Android Release | Capacitor Android build, splash screen, adaptive icons, release bundle | In Progress |
| **Phase 16** | Verification & QA | 50+ end-to-end tests, security tests, rate limiting, R2 persistence | In Progress |
| **Phase 17** | Production Deployment | Netlify + Render deployment verification, monitoring, environment variables | In Progress |

---

## Detailed Action Items

### 1. Mobile Phone Navigation Fix
- Register `@capacitor/app` listener in `src/main.tsx` or `AppShell.tsx`:
  ```ts
  import { App as CapApp } from '@capacitor/app';
  CapApp.addListener('backButton', ({ canGoBack }) => { ... });
  ```
- Implement sticky mobile bottom navigation bar in `AppShell.tsx`:
  - 5 primary touch tabs: Syllabus, AI Tutor, Practice, Progress, Family View.
  - Safe area inset padding (`pb-safe`, `min-h-[56px]`).

### 2. Family Relational Schema & Child Isolation
- Implement `families`, `family_members`, and `guardianships` tables in PostgreSQL.
- Ensure each child profile possesses dedicated:
  - Course enrollments (`student_enrollments`)
  - AI conversation threads (`ai_conversations`)
  - Assignment submissions (`assignment_submissions`)
  - Attempt events & mastery states (`sync_events`)

### 3. EmailJS Strict 3-Template Protocol
- `EMAILJS_TEMPLATE_VERIFICATION`: OTP codes for student/parent/admin registration.
- `EMAILJS_TEMPLATE_PASSWORD_RESET`: OTP codes for account recovery.
- `EMAILJS_TEMPLATE_NOTIFICATION`: Transactional notifications conditional on `notification_type`.

### 4. Direct L2 Institution Academic Administration
- Ensure Institution Administrator directly manages:
  - Academic years, semesters, departments, programmes.
  - Teacher subject assignments and class section schedules.
  - Eliminate standalone HOD permission barriers.
