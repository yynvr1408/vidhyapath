# Vidyapath — Comprehensive Codebase Audit

**Date:** November 2026  
**Auditor:** Vidyapath Engineering Team  
**Scope:** Full-stack architecture, Authentication, Database (Neon PostgreSQL), APIs, Mobile (Capacitor Android), PWA, AI Services, Storage (Cloudflare R2), and Multi-Tier Role Hierarchy.

---

## 1. Executive Summary

An exhaustive audit of the `vidhyapath` repository was conducted across frontend (`src/`), backend (`server/`), Android (`android/`), test suites (`tests/`), and deployment configurations (`render.yaml`, `netlify.toml`, `capacitor.config.json`).

Vidyapath has strong foundational primitives:
- Deterministic multilingual curriculum engine for Telugu (`te`), Hindi (`hi`), and English (`en`).
- Responsive client build via React 18, Vite, and Tailwind CSS.
- Capacitor 8 Android container.
- Node.js Express backend with serverless Neon PostgreSQL and Cloudflare R2 object storage.
- Groq Cloud LPU integration with Socratic pedagogical AI guardrails.

However, several critical production and enterprise requirements were incomplete or needed refinement:
1. **Phone Navigation Controls**: Android hardware back button was unhandled because `@capacitor/app` was missing; mobile web lacked a dedicated sticky bottom navigation bar for single-handed mobile phone usage.
2. **Account Hierarchy Alignment**: Academic administration was fragmented across separate roles (`hod`, `academic_admin`) rather than unified directly under **L2 Institution Administrator**.
3. **Family Management & Multi-Student Accounts**: Sibling/family grouping existed in UI demo state but lacked dedicated family relational tables, parent-student invitation tokens, and separate AI conversation histories per child profile.
4. **Email Delivery Consolidation**: EmailJS needed strict consolidation into **exactly three reusable templates** (Verification, Password Recovery, Account & Security Notifications).
5. **Real Database Persistence**: Several endpoints relied on memory maps rather than bi-directional persistence to Neon PostgreSQL with schema migrations.

---

## 2. Component-by-Component Audit

### 2.1 Technology Stack & Configurations
| Configuration File | Current State | Audit Finding | Action Required |
|---|---|---|---|
| `package.json` | React 18, Vite, Capacitor Core/Android/iOS, Express, pg, S3 SDK | Missing `@capacitor/app`, `@capacitor/keyboard`, `@capacitor/status-bar` | Installed plugins and synced native Android bridge. |
| `capacitor.config.json` | App ID `org.vidyapath.app`, `webDir: "dist"` | Android scheme HTTPS configured properly | Retain; wire hardware back-button listener. |
| `render.yaml` | Backend Web Service, Node.js, `sync: false` for R2 secrets | Clean build and start scripts | Retain; add EmailJS 3-template env vars. |
| `netlify.toml` | Frontend Edge CDN, SPA rewrites, API proxy | Proxy routes to Render backend | Retain; verify production SSL proxy. |
| `android/` | Gradle 8, Android SDK 34, Java 21 | Adaptive icons generated, obsolete capacitor vector override removed | Ensure native back button handling. |

### 2.2 Role & Access Control Hierarchy
- **L1 — Super Administrator**: Global overview, institution review/approval, course management, platform health.
- **L2 — Institution Administrator**: Direct control over departments, programmes, academic years, semesters, classes, sections, subjects, teachers, students, assignments, and quizzes. *Audit fix:* Consolidate all academic operations directly under Institution Admin (no separate HOD role).
- **L3 — Teacher / Faculty**: Manage assigned classes, upload notes/resources, create assignments, grade quizzes, provide feedback.
- **L4 — Student**: Enrolled courses, lessons, notes, assignments, quizzes, Socratic AI Tutor, offline downloads.
- **L5 — Parent / Guardian**: Family account owner, multiple child student profiles, independent progress tracking, attendance monitoring.

### 2.3 Authentication & Password Recovery
- **Registration Pathways**: Need unified multi-pathway registration (Student, Parent, Family, Teacher, Institution, Independent Learner).
- **Password Recovery**: Implemented OTP-based reset via EmailJS Template 2; must ensure strict 6-digit numeric OTP with 5-minute validity, single-use invalidation, and session revocation.
- **Student Privacy (Zero-PII)**: Students can use simple username + PIN + Safety Question recovery without requiring personal email or mobile OTPs.

### 2.4 Mobile Phone Navigation
- **Capacitor Android Back Button**: Hardware back button now intercepted via `App.addListener('backButton')`.
  - Drawer open $\to$ close drawer.
  - Modal open $\to$ close modal.
  - Sub-screen $\to$ navigate back to home syllabus.
  - Home screen $\to$ double-tap to exit application.
- **Mobile Bottom Navigation Bar**: Sticky 5-tab bar on mobile screens (`md:hidden`) for Syllabus, AI Tutor, Practice, Progress, and Family/Parent View.

---

## 3. Gap Analysis & Resolution Plan
1. **Database Schema**: Add tables for `families`, `family_members`, `guardianships`, `guardian_consents`, `courses`, `course_enrollments`, `ai_conversations`, `ai_messages`.
2. **Email Architecture**: Standardize on exactly 3 EmailJS templates across all transactional routes.
3. **Navigation**: Deploy native back-button listener and sticky mobile bottom navigation.
4. **Testing Suite**: Maintain 100% test passing across `npm run build`, `vitest run tests/unit`, `vitest run tests/ui`, and `npm test`.
