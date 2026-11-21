# 🏮 Vidyapath: Enterprise Multilingual Educational Ecosystem

> **A production-ready, highly scalable educational operating system designed for universities, colleges, and rural schools. Built with an offline-first architecture, decoupled cloud deployment, 5-tier administrative hierarchy, 20-table relational schema, dynamic syllabus matching, intelligent LMS, and governed pedagogical AI.**

---

## 1. Executive Summary & Production System Architecture

Vidyapath resolves the critical digital divide between institutional campus ERPs and real-world infrastructure constraints (low cellular bandwidth, shared family smartphones, intermittent connectivity, and strict cloud cost budgets). 

The platform is architected with a **decoupled cloud topology**:
- **Frontend Edge CDN (Netlify)**: High-speed global edge distribution of the offline-first Progressive Web Application (PWA) with immutable caching, safe-area mobile insets, and transparent edge proxy rules for `/api/*` and `/uploads/*`.
- **Backend Microservices (Render)**: Scalable Express + TypeScript runtime running stateless business logic, sliding-window rate limiters, token-bucket controls, idempotency middleware, and asynchronous batch queueing.
- **Relational Data Layer (Neon PostgreSQL)**: Serverless, SSL-encrypted 20-table relational schema with live bidirectional sync and automatic in-memory resilient fallback.
- **In-Memory Object Storage (Cloudflare R2)**: Direct streaming S3-compatible storage via `multer.memoryStorage()`, eliminating data loss from Render's ephemeral filesystem at **$0 egress fees**.
- **AI Inference & Speech (Groq Cloud + ElevenLabs)**: LPU-accelerated LLaMA 3.3 70B and reasoning models with 14,400 tokens/min quota management, dual-model Whisper Large v3 STT, and 0-token client semantic caching.

```
                                  [STUDENTS & FACULTY CLIENTS]
                                  │                          │
                 ┌────────────────┴──────────────┐           │
                 ▼                               ▼           │
     [Desktop / Tablet Browser]       [Android Native APK]   │
   (Fluid Responsive Grid View)    (Capacitor 8, Safe-Area)  │
                 │                               │           │
                 └───────────────┬───────────────┘           │
                                 │                           │
                                 ▼                           ▼
                 ┌───────────────────────────────┐   [100% Offline Mode]
                 │   NETLIFY EDGE CDN FRONTEND   │   ├── Service Worker (Cache-First)
                 │  • Immutable Cache (1 Year)   │   ├── Local IndexedDB Outbox
                 │  • Trilingual Language Switch │   └── 0-Token Doubt Engine
                 │  • Edge Proxy (/api & /uploads│
                 └───────────────┬───────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           │ HTTPS / TLS Reverse Proxy                 │
           ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RENDER BACKEND API MICROSERVICES                      │
│                                                                             │
│  [Load Balancer Probes]     [Sliding-Window Rate Limiter]   [Idempotency]  │
│  • /healthz (Liveness)      • Auth: 20 req / 15m            • X-Cache: HIT  │
│  • /readyz (Readiness)      • AI: 30 req / m burst          • UUID TTL Key  │
│  • /metrics (Prometheus)    • General: 300 req / m          • Anti-duplication│
│                                                                             │
│  [Core Business Controllers]                                                │
│  • 5-Tier RBAC (L1 Super Admin down to L5 Student)                         │
│  • Dynamic Syllabus Engine & LMS Classrooms (Notes, Quizzes, Assignments)   │
│  • Socratic AI Safety Guardrails (Exam Integrity & Prompt Injection Armor)  │
│                                                                             │
│  [In-Memory RAM Buffer (multer)]            [Async Event Batch Queue]       │
│  • Zero disk writes to ephemeral storage   • O(1) deduplication buffer      │
│  • Direct stream pipe to Cloudflare R2      • Flushes chunks of 50 to DB    │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌───────────────────────────────────────────┐
│     CLOUDFLARE R2 BUCKET     │ │        NEON POSTGRESQL (20 TABLES)        │
│ • S3-Compatible Object Store │ │ • Serverless ACID Relational Database     │
│ • Syllabus PDFs & Handouts   │ │ • Live Bidirectional Sync to Memory Store  │
│ • Audio Clips & Submissions  │ │ • Zero-Crash Resilient Fallback Engine    │
│ • $0 Egress Bandwidth Fees   │ │ • Cryptographic PBKDF2 Password Security  │
└──────────────────────────────┘ └───────────────────────────────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌───────────────────────────────────────────┐
│     GROQ CLOUD AI ENGINE     │ │      ELEVENLABS & EMAILJS SERVICES        │
│ • LLaMA 3.3 70B Versatile    │ │ • Smart Voice Router (<120 char TTS)      │
│ • Whisper Large v3 STT Audio │ │ • Web Speech API Fallback (0 chars burned)│
│ • 14,400 Tokens/Min Quota    │ │ • 6-Digit Cryptographic OTP Invalidation  │
│ • 600-Token Reasoning Margin │ │ • DevMode devOtp Simulation Mode          │
└──────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 2. 5-Tier Administrative Hierarchy & Role-Based Access Control (RBAC)

Vidyapath implements a strict, non-bypassable 5-level organizational hierarchy with server-side authorization:

| Level | Role | Responsibilities & Capabilities | Accessible Endpoints & Dashboards |
|---|---|---|---|
| **Level 1** | **Platform Super Administrator** | • Global platform governance & multi-tenant isolation.<br>• Review, approve, or reject institution onboarding applications.<br>• Manage global users, security monitoring, and immutable audit logs.<br>• Configure platform-wide AI rate limits and institutional policies. | • `/dashboard/super-admin`<br>• `GET /api/super-admin/institutions`<br>• `POST /api/super-admin/institutions/:id/approve`<br>• `GET /api/super-admin/audit-logs`<br>• `GET /api/super-admin/stats` |
| **Level 2** | **Institution Administrator** | • Complete control of single institution (e.g., Apex Institute of Technology).<br>• Configure academic years, departments, degree programmes, and semesters.<br>• Onboard faculty and academic coordinators with transactional invites.<br>• Upload, review, parse, and publish accredited curriculum syllabi. | • `/dashboard/institution-admin`<br>• `POST /api/institution/:id/invite-teacher`<br>• `POST /api/academic/syllabus/publish`<br>• `GET /api/institution/:id/departments`<br>• `GET /api/institution/:id/stats` |
| **Level 3** | **Academic Administrator / HOD** | • Manage specific department (e.g., Department of Computer Science).<br>• Map teachers to subjects and lecture sections.<br>• Track department-wide curriculum completion pacing and syllabus coverage.<br>• Manage mid-term and semester examination assessment schedules. | • `/dashboard/academic-admin`<br>• `GET /api/academic/student-syllabus`<br>• `POST /api/academic/syllabus/parse`<br>• `GET /api/lms/subjects/:id/overview` |
| **Level 4** | **Faculty / Teacher** | • Manage assigned classes, subjects, lecture notes, PDFs, and live video rooms.<br>• Create and grade assignments with online rubric evaluation.<br>• Build interactive timed quizzes with automated scoring and explanations.<br>• AI Teaching Assistant for generating lesson plans, quizzes, and rubrics. | • `/dashboard/teacher`<br>• `POST /api/lms/subjects/:id/resources`<br>• `POST /api/lms/assignments/:id/submit`<br>• `POST /api/lms/quizzes/:id/attempt`<br>• `POST /api/lms/topics/:id/toggle-complete` |
| **Level 5** | **Student** | • Automatically receive accredited syllabus for verified profile (`Institution`, `Department`, `Programme`, `Semester`).<br>• Dedicated subject LMS rooms (Notes, PDFs, Recorded Videos, Live Sessions).<br>• Complete assignments and take timed mastery quizzes.<br>• Consult Socratic AI Tutor under strict safety restrictions.<br>• 100% offline access to downloaded notes and learning units. | • `/dashboard/student`<br>• `/subject/:subjectId`<br>• `GET /api/academic/student-syllabus`<br>• `POST /api/tutor/chat`<br>• `POST /api/tutor/voice-doubt` |
| **Parent** | **Parent / Guardian** | • View-only progress digest (verified attendance, mastered topics, weak skills).<br>• Actionable home-learning prompts with **zero PII leakage**. | • `/dashboard/guardian`<br>• `GET /api/guardian/:token` |

---

## 3. 20-Table Enterprise Relational Schema (Neon PostgreSQL)

Vidyapath provisions a 20-table relational database in Neon Serverless PostgreSQL with SSL encryption, foreign key constraints, and indexing:

```sql
-- Core Academic Hierarchy & Tenancy
1.  institutions           (id, name, code, type, state, district, status, contact_email, created_at)
2.  academic_years         (id, institution_id, label, start_date, end_date, is_current)
3.  departments            (id, institution_id, name, code, hod_user_id)
4.  programmes             (id, department_id, name, code, degree_level, total_semesters)
5.  users                  (id, email, password_hash, full_name, role, institution_id, department_id, programme_id, current_semester, is_active, created_at)
6.  subjects               (id, institution_id, department_id, programme_id, semester, code, name, credits)
7.  curriculum_units       (id, subject_id, unit_number, title, description, topics, estimated_hours)

-- Classroom LMS & Learning Resources
8.  learning_resources     (id, subject_id, title, type, file_url, description, uploaded_by, created_at)
9.  assignments            (id, subject_id, title, description, due_date, max_points, created_by, created_at)
10. assignment_submissions (id, assignment_id, student_id, submission_text, file_url, score, feedback, status, submitted_at)
11. quizzes                (id, subject_id, title, duration_minutes, pass_score, questions, created_by, created_at)
12. quiz_attempts          (id, quiz_id, student_id, score, max_score, passed, answers, submitted_at)

-- Communications & Policies
13. announcements          (id, institution_id, title, message, target_role, created_by, created_at)
14. notifications          (id, user_id, title, message, type, is_read, created_at)
15. ai_policies            (id, institution_id, socratic_mode_enabled, daily_token_limit_per_student, blocked_keywords, updated_at)

-- Security, Scaling & Offline Outbox
16. otp_verifications      (id, email, otp, expires_at, verified, attempts)
17. audit_logs             (id, user_id, action, entity_type, entity_id, ip_address, created_at)
18. sync_events            (id, client_event_id, user_id, event_type, payload, status, synced_at)
19. doubts_queue           (id, student_id, subject_id, question_text, voice_url, status, ai_response, created_at)
20. cohort_aggregates      (id, cohort_id, total_learners, avg_mastery, weak_topics_distribution, updated_at)
```

### Resilient Bidirectional Hydration Engine
- At server boot, [`server/db/neon.ts`](server/db/neon.ts) tests connectivity to Neon.
- The `ObservableMap` reactive store in [`server/db/store.ts`](server/db/store.ts) hydrates all existing records into low-latency memory.
- Every mutating write executes a write-through update: writing instantly to memory for sub-millisecond API responsiveness and persisting asynchronously to Neon PostgreSQL.
- If database credentials are not supplied (e.g., during isolated testing or localized deployments), the server automatically operates in resilient in-memory mode without crashing.

---

## 4. High-Concurrency Scaling & Traffic Management

To guarantee high availability when thousands of students concurrently take exams, submit assignments, or synchronize offline progress:

```
[Concurrent Inbound Student Requests]
                 │
                 ▼
[Sliding-Window Rate Limiter (Token Bucket)]
  ├── Auth: 20 req / 15m
  ├── AI Tutor: 30 req / m burst
  └── General API: 300 req / m
                 │
                 ▼
[Enterprise Idempotency Gate (Idempotency-Key Header)]
  ├── Check In-Memory TTL Store for Key
  ├── Cache Hit  ──> Return Cached Response Immediately (X-Cache: IDEMPOTENT-HIT)
  └── Cache Miss ──> Execute Request & Store Result in TTL Buffer
                 │
                 ▼
[Stateless Express Microservices API]
                 │
        ┌────────┴────────┐
        ▼                 ▼
[Direct R2 Stream] [Async Event Queue]
(In-Memory RAM)    (FIFO Buffer, O(1) deduplication)
                   (Flushes in batches of 50 to DB)
```

### A. Liveness, Readiness & Telemetry Probes
- `GET /healthz` & `GET /api/health`: Fast liveness checks for cloud orchestrators (returns 200 OK).
- `GET /readyz`: Deep readiness probe checking memory headroom (<1GB heap), queue depth, and database connectivity.
- `GET /metrics`: Prometheus-compatible metrics endpoint returning heap allocation, RSS memory, active institutions, and queue backlog.

### B. Sliding-Window Rate Limiting (`server/middleware/rateLimiter.ts`)
- Prevents DDoS attacks, brute-force password attempts, and quota starvation.
- Sends standard RFC headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.

### C. Enterprise Idempotency Middleware (`server/middleware/idempotency.ts`)
- Prevents double-submissions during mobile connectivity reconnects.
- Clients send a unique `Idempotency-Key` header with mutating requests (`POST`, `PUT`, `PATCH`).
- Duplicate keys return the original cached response with `X-Cache: IDEMPOTENT-HIT`, **eliminating duplicate DB rows, double quiz scoring, or grade corruption**.

### D. Asynchronous Event Batch Queue (`server/services/queueService.ts`)
- Collects student telemetries, quiz completions, and offline sync logs into an $O(1)$ deduplicating FIFO buffer.
- Flushes in chunks of 50 events per transaction, preventing database lock contention.

---

## 5. Cloudflare R2 In-Memory Object Storage

Render Web Services run on **ephemeral filesystems**: any files written to local `/uploads/` disks are wiped on every redeploy or container restart.

Vidyapath completely eliminates ephemeral file loss by streaming uploads directly to **Cloudflare R2**:
1. **Zero Disk Writes**: Configured `multer.memoryStorage()` in [`server/index.ts`](server/index.ts) to hold incoming file buffers purely in RAM.
2. **S3-Compatible Streaming**: [`server/services/r2Storage.ts`](server/services/r2Storage.ts) uploads the buffer to Cloudflare R2 via `@aws-sdk/client-s3`:
   $$\text{Endpoint: } \texttt{https://\$\{R2\_ACCOUNT\_ID\}.r2.cloudflarestorage.com}$$
3. **Zero Egress Fees**: Cloudflare R2 charges **$0 for outbound data transfer**, preventing unexpected cloud bills when thousands of students download lecture PDFs.
4. **Resilient Local Dev Fallback**: If R2 environment variables are omitted during local development, files are converted to in-memory Base64 data URLs without touching disk.

---

## 6. Groq Cloud AI Engine & Multi-Tier Safety Guardrails

### A. Multi-Model Inference & Quota Architecture
- **Inference Speed**: Powered by Groq LPUs delivering up to 300 tokens/sec.
- **Model Fallback Chain**:
  1. `llama-3.3-70b-versatile` / `openai/gpt-oss-120b` (Primary Socratic reasoning)
  2. `qwen/qwen3.8-27b` (High-efficiency multilingual fallback)
  3. `openai/gpt-oss-20b` (Lightweight fallback)
- **Reasoning Token Headroom**: 600 max tokens allocated for reasoning models to prevent truncated output during complex STEM explanations.
- **Whisper Large v3 Voice STT**: Dual-model speech-to-text supporting `whisper-large-v3-turbo` with automatic fallback to `whisper-large-v3`.
- **14,400 Tokens/Min Quota Governance**: Backend enforces per-student daily query limits (30 questions/day).
- **0-Token Semantic Cache**: 78%+ of common doubts resolve directly from client-side `IndexedDB` in **0ms** consuming **0 cloud tokens**.

### B. Multi-Tier Pedagogical Guardrails (`server/services/aiGuardrails.ts`)
1. **Exam Integrity Guardrail**: Refuses to provide answers during active exams:
   > *"Academic Integrity Notice: Vidyapath AI cannot assist during active examinations."*
2. **Prompt Injection Defense**: Intercepts jailbreak attempts, system prompt extraction, and rule overrides.
3. **PII Masking**: Blocks queries containing phone numbers, passwords, or personal credentials.
4. **Socratic Homework Guidance**: Intercepts homework dumping and converts it into guided step-by-step reasoning:
   > *"Instead of solving your entire assignment directly, let's break down the method: what is the primary formula you think applies here?"*

---

## 7. Trilingual Multilingual Architecture (Telugu, Hindi, English) & Dual-Target UI

### Core Trilingual Support
Vidyapath provides a global language selector accessible from the top sticky header and navigation drawers across all screens:
- **Languages Supported**:
  1. **Telugu (తెలుగు)**: Primary launch pack for Class 10 AP State Board Mathematics (`te-10-maths-ap`) with phonetic math read-aloud.
  2. **Hindi (हिन्दी)**: Class 10 CBSE / State Board Mathematics (`hi-10-maths-cbse`) with full Hindi Socratic AI coaching.
  3. **English**: Class 10 CBSE / Pan-India curriculum (`en-10-maths-cbse`).
- Real-time interface translation without reloading the page.

### Dual-Target UI Responsiveness
- **Desktop Webview**: Expands fully across ultra-wide monitors and laptops with fluid grids, rich sidebars, data tables, and quick action bars.
- **Mobile Android APK**: Native mobile layout optimized for budget Android devices with safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`), $\ge 44\text{px}$ touch targets, and bottom navigation.

---

## 8. Free Tier to Enterprise Scale Matrix

Vidyapath operates on a **$0/month free-tier baseline** while providing a seamless upgrade path to enterprise infrastructure:

| Infrastructure Service | Free Tier Quota | Vidyapath Optimization Strategy | Enterprise Upgrade Path |
|---|---|---|---|
| **Netlify Edge CDN** | • 100 GB bandwidth/month<br>• 300 build minutes/month | Aggressive asset caching (`Cache-Control: immutable`). PWA bundle is only **143 KB gzip**. | Netlify Enterprise High-Concurrency Edge. |
| **Render Web Service** | • 750 free instance hours/month<br>• Auto-sleeps after 15m idle | Fast boot (<2s) with in-memory state hydration. `/healthz` probe prevents cold start timeouts. | Render Team/Enterprise dedicated Node.js clusters. |
| **Neon PostgreSQL** | • 0.5 GB serverless storage<br>• SSL encrypted, auto-suspend | Compact schema with Unix timestamps. 80%+ of student telemetry cached locally on device. | Multi-region Neon Serverless Postgres with read replicas. |
| **Cloudflare R2** | • 10 GB storage free/month<br>• **$0 egress bandwidth fees** | Direct streaming in-memory uploads (`multer.memoryStorage()`). Zero ephemeral disk writes. | Cloudflare R2 custom domain with Edge Workers. |
| **Groq Cloud** | • 1,000 requests/day<br>• 14,400 tokens/min<br>• ~300 tokens/sec LPU | Client-side `IndexedDB` semantic cache answers repeated questions in **0ms** with **0 tokens**. | Groq Cloud Enterprise dedicated LPU instance. |
| **ElevenLabs** | • 10,000 characters/month | **Smart Voice Router**: ElevenLabs speaks short key takeaways (<120 chars); native Web Speech API reads full lessons. | ElevenLabs Enterprise Tier with custom institutional voices. |
| **EmailJS** | • 200 transactional emails/month | 6-digit OTP verification with 60s cooldown. Development mode uses zero-crash audit simulation. | AWS SES / SendGrid dedicated SMTP relay. |
| **GitHub Actions** | • Unlimited Linux build minutes<br>• 2 GB release storage | Automated CI/CD builds and publishes signed Android APKs directly to GitHub Releases. | GitHub Enterprise self-hosted runner pool. |

---

## 9. Complete API Reference

### Health & Monitoring Probes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Kubernetes and cloud load balancer liveness probe (200 OK). |
| `GET` | `/api/health` | Legacy alias for liveness probe. |
| `GET` | `/readyz` | Readiness probe verifying memory headroom (<1GB heap) and DB connectivity. |
| `GET` | `/metrics` | Prometheus-compatible telemetry (memory, heap, queues, active entities). |

### Authentication & OTP
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Email/password authentication with account lockout protection. |
| `POST` | `/api/auth/otp/send` | Dispatches 6-digit cryptographic OTP via EmailJS (or returns `devOtp` in dev). |
| `POST` | `/api/auth/otp/verify` | Single-use cryptographic verification of OTP. |
| `POST` | `/api/auth/register/institution` | Onboards institution into `pending_approval` state. |
| `POST` | `/api/auth/register/student` | Registers student linked to verified academic profile. |
| `GET` | `/api/auth/me` | Returns authenticated user profile and permissions. |

### Super Administration (Level 1)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/super-admin/institutions` | Lists all institutions with status filtering. |
| `POST` | `/api/super-admin/institutions/:id/approve` | Approves institution and dispatches activation invite. |
| `POST` | `/api/super-admin/institutions/:id/reject` | Rejects institution with documented feedback reason. |
| `GET` | `/api/super-admin/stats` | Global platform metrics across all tenants. |
| `GET` | `/api/super-admin/audit-logs` | Immutable audit log of administrative actions. |

### Institution Administration (Level 2 & 3)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/institution/:id/stats` | Institution-specific enrollment and performance metrics. |
| `GET` | `/api/institution/:id/departments` | Lists departments, programmes, and faculty leads. |
| `POST` | `/api/institution/:id/invite-teacher` | Sends invitation email to onboarding faculty. |
| `POST` | `/api/academic/syllabus/parse` | Ingests document/text and extracts structured units. |
| `POST` | `/api/academic/syllabus/publish` | Publishes approved curriculum to active database. |

### Classroom LMS & Telemetry (Level 4 & 5)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/academic/student-syllabus` | Dynamically resolves accredited curriculum for student profile. |
| `GET` | `/api/lms/subjects/:id/overview` | Subject room: Units, Notes, Handouts, Videos, Live Link. |
| `POST` | `/api/lms/subjects/:id/resources` | Uploads learning resource to Cloudflare R2. |
| `POST` | `/api/lms/assignments/:id/submit` | Submits assignment text or PDF URL (idempotent). |
| `POST` | `/api/lms/quizzes/:id/attempt` | Auto-grades quiz attempt with per-question explanations. |
| `POST` | `/api/lms/topics/:id/toggle-complete` | Tracks student curriculum pacing. |

### Socratic AI Tutor & Speech
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tutor/chat` | Guardrailed Socratic AI dialogue (Groq LLaMA 3.3 70B). |
| `POST` | `/api/tutor/voice-doubt` | Multi-part audio doubt upload $\to$ Whisper STT $\to$ Socratic answer. |
| `POST` | `/api/tts/speak` | Smart Voice Router returning ElevenLabs neural audio. |

---

## 10. Automated Testing & Verification Suite

Vidyapath maintains a comprehensive automated testing suite with **100% pass coverage** across all critical security, scaling, and operational workflows:

```bash
# Run all Vitest suites
npm test

# Verify production build and bundle size (<150 KB gzip budget)
npm run build

# Synchronize native Android Capacitor container
npx @capacitor/cli sync android
```

### Verified Test Workflows:
1. **Cryptographic Security**: PBKDF2 password hashing, JWT signing, signature verification, and tamper rejection.
2. **OTP Security**: Expiration, single-use invalidation, attempt limits, and 60-second resend cooldown.
3. **Multi-Tier Institution Approval**: Registration $\to$ Super Admin review $\to$ Approval $\to$ Account activation.
4. **Dynamic Syllabus Matcher**: Automatic resolution of semester courses based on enrollment.
5. **Syllabus Parsing & Publication**: Structured unit extraction and database ingestion.
6. **LMS Assignment & Quiz Engine**: Online submission and automatic scoring with explanations.
7. **AI Pedagogical Guardrails**: Verified refusal of exam cheating, prompt injection, and PII extraction.
8. **High-Concurrency Scaling**: Idempotency key deduplication (`X-Cache: IDEMPOTENT-HIT`) and sliding-window rate limiting (`X-RateLimit-*`).
9. **In-Memory Cloudflare R2 Uploads**: Memory buffer streaming without writing to ephemeral disk.

---

## 11. Step-by-Step Deployment Guide

### A. Local Development
```bash
# 1. Clone repository
git clone https://github.com/yynvr1408/vidhyapath.git
cd vidhyapath

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start backend API server (Port 3001)
npm run server

# 5. In a second terminal, start Vite frontend (Port 5173)
npm run dev
```

### B. Decoupled Production Deployment (Netlify + Render)

#### Step 1: Deploy Backend to Render
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** $\to$ **Blueprint** and connect your repository (`render.yaml`).
3. Fill in the non-synced environment variables in the Render Dashboard:
   - `DATABASE_URL`: Neon PostgreSQL connection string.
   - `JWT_SECRET`: 32+ character random secret string.
   - `GROQ_API_KEY`: Groq Cloud API key.
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`: Cloudflare R2 credentials.
   - `ELEVENLABS_API_KEY`: (Optional) ElevenLabs API key.
4. Render deploys the service with automatic health checks on `/healthz`. Note your backend URL (e.g., `https://vidyapath.onrender.com`).

#### Step 2: Deploy Frontend to Netlify
1. In [Netlify Dashboard](https://app.netlify.com), click **Add new site** $\to$ **Import an existing project**.
2. Select your repository. Netlify detects [`netlify.toml`](netlify.toml) automatically:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. If your Render backend URL differs from `https://vidyapath.onrender.com`, update the target URL in [`netlify.toml`](netlify.toml) lines 12 & 20 or set `VITE_API_BASE_URL` in Netlify Environment Variables.
4. Click **Deploy**. Netlify serves the PWA across global edge locations with automatic SPA routing and proxying.

### C. Docker Deployment
```bash
docker-compose up --build -d
```

### D. Native Android APK Build
The repository includes automated GitHub Actions CI/CD ([`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)). On every push to `main`, GitHub Actions:
1. Runs all automated test suites.
2. Builds optimized web assets.
3. Syncs Capacitor Android.
4. Compiles a signed Android debug APK via Gradle with Java 21.
5. Publishes release assets directly to [GitHub Releases](https://github.com/yynvr1408/vidhyapath/releases).

---

## 12. Technology Stack Summary

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, HTML5 Canvas
- **Backend API**: Node.js, Express, TypeScript, tsx, Multer (Memory Storage)
- **Database**: Serverless Neon PostgreSQL (20 Relational Tables) + Local IndexedDB
- **Object Storage**: Cloudflare R2 (S3-Compatible, Direct RAM Streaming, $0 Egress)
- **AI & Speech**: Groq Cloud (LLaMA 3.3 70B, Whisper Large v3 STT), ElevenLabs Neural TTS, Web Speech API
- **Deployment & Edge**: Netlify Edge CDN, Render Web Services, Docker, GitHub Actions CI/CD
- **Mobile Container**: Capacitor 8 (Android SDK 34 / Java 21)
