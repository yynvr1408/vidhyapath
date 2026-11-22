# Vidyapath — Complete Implementation Roadmap

> **Current direction (2026-11-22):** browser PWA first. The Android release phase is deferred until routes and progress sync are stable; historical completion labels below do not describe the current Android state. See [WEB_FIRST_ARCHITECTURE.md](WEB_FIRST_ARCHITECTURE.md).

**Phased Execution Plan for Production Transformation**

---

## Phase Overview

| Phase | Domain | Core Objectives | Status |
|---|---|---|---|
| **Phase 1** | Audit & Architecture | Document codebase audit, schema, API architecture, and progress log | Complete |
| **Phase 2** | Database & Persistence | 27 Neon PostgreSQL tables: Family, Courses, AI Conversations, Learning Resources | Complete |
| **Phase 3** | Authentication & Security | Unified auth lifecycle, PBKDF2 (10k iterations), JWT, lockout protection, hardened CORS | Complete |
| **Phase 4** | EmailJS Consolidation | Enforce strict 3-template architecture: Verification, Password Reset, Notifications | Complete |
| **Phase 5** | Registration Pathways | Student (Zero-PII PIN), Parent, Family, Teacher, Institution, Independent Learner | Complete |
| **Phase 6** | Family Management | Multiple student sibling profiles per family, child switcher, strict sibling isolation | Complete |
| **Phase 7** | L1 Super Admin | Real database statistics, institution approvals, global course publishing | Complete |
| **Phase 8** | L2 Institution Admin | Direct academic administration (no separate HOD), departments, classes, subjects | Complete |
| **Phase 9** | L3 Teacher & L4 Student | Class assignments, quiz grading, student learning portal, LMS workflows | Complete |
| **Phase 10** | Course & Curriculum Engine | Global $\to$ Institution course adoption, syllabus progression, RAG indexing | Complete |
| **Phase 11** | Socratic AI Tutor | Trilingual RAG, separate student conversation history, guardrails, Groq Llama 3 | Complete |
| **Phase 12** | L5 Parent Dashboard | Child switcher, progress metrics, attendance, teacher notes, safety question PIN reset | Complete |
| **Phase 13** | Offline & Sync | IndexedDB offline cache, Service Worker, idempotent sync events, account bridge | Complete |
| **Phase 14** | Web Mobile & UI/UX | Responsive browser navigation, touch targets, and modal dismissal | Web flow implemented; current refactor pending verification |
| **Phase 15** | Android Release | Native package, splash screen, adaptive icons, release bundle | Deferred until the web flow is stable |
| **Phase 16** | Verification & QA | Unit, UI, and E2E suites after the current route and sync changes | Pending |
| **Phase 17** | Production Deployment | Netlify + Render deployment verification, monitoring, environment variables | Complete |

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
