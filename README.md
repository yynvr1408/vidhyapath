# 🏮 Vidyapath: Enterprise Multilingual Educational Ecosystem

> **A production-ready, scalable educational platform designed for universities, colleges, and schools — built with an offline-first architecture, 5-tier administrative hierarchy, dynamic syllabus matching, intelligent LMS, and governed pedagogical AI.**

---

## 1. Executive Summary & Product Architecture

Vidyapath bridges the gap between high-end campus management systems and real-world infrastructure constraints (low cellular bandwidth, shared student phones, intermittent connectivity). It combines an **enterprise-grade administrative and academic hierarchy** with an **offline-first Progressive Web Application (PWA)** and **multi-tier pedagogical AI guardrails**.

```
                                    ┌───────────────────────────────────────────────────┐
                                    │         PLATFORM SUPER ADMINISTRATOR (L1)         │
                                    │   Institution Approvals • Global Users • Audit    │
                                    └─────────────────────────┬─────────────────────────┘
                                                              │
                                    ┌─────────────────────────▼─────────────────────────┐
                                    │            INSTITUTION ADMINISTRATOR (L2)         │
                                    │    Academic Years • Departments • Syllabi Center  │
                                    └─────────────────────────┬─────────────────────────┘
                                                              │
                                    ┌─────────────────────────▼─────────────────────────┐
                                    │        DEPARTMENT HEAD / ACADEMIC ADMIN (L3)      │
                                    │     Curriculum Pace • Faculty-Subject Allocation  │
                                    └─────────────────────────┬─────────────────────────┘
                                                              │
                                    ┌─────────────────────────▼─────────────────────────┐
                                    │               FACULTY / TEACHER (L4)              │
                                    │    Classroom LMS • Resources • Assignments • Quiz │
                                    └─────────────────────────┬─────────────────────────┘
                                                              │
                            ┌─────────────────────────────────┴─────────────────────────────────┐
                            │                                                                   │
             ┌──────────────▼──────────────┐                                     ┌──────────────▼──────────────┐
             │         STUDENT (L5)        │                                     │      PARENT / GUARDIAN      │
             │ Dynamic Syllabus • LMS Room │                                     │   Verified Attendance &     │
             │ Socratic AI • Offline Hub   │                                     │     Mastery Digest          │
             └─────────────────────────────┘                                     └─────────────────────────────┘
```

---

## 2. 5-Tier Administrative Hierarchy & Role-Based Access Control (RBAC)

| Level | Role | Responsibilities & Capabilities | Accessible Endpoints & Dashboards |
|---|---|---|---|
| **L1** | **Platform Super Admin** | • Platform-wide governance & tenant isolation.<br>• Review, approve, or reject institution onboarding requests.<br>• Global user directory, security monitoring, and audit trails.<br>• Configure global AI rate limits and institutional policies. | • `/dashboard/super-admin`<br>• `GET /api/super-admin/institutions`<br>• `POST /api/super-admin/institutions/:id/approve`<br>• `GET /api/super-admin/audit-logs` |
| **L2** | **Institution Admin** | • Manage single institution (e.g., Apex Institute of Technology).<br>• Configure academic years, departments, degree programmes, and semesters.<br>• Onboard faculty members with automated email invitations.<br>• Review, edit, and publish official curriculum syllabi. | • `/dashboard/institution-admin`<br>• `POST /api/institution/:id/invite-teacher`<br>• `POST /api/academic/syllabus/publish`<br>• `GET /api/institution/:id/departments` |
| **L3** | **Academic Admin / HOD** | • Manage department (e.g., Department of Computer Science).<br>• Map faculty members to subjects.<br>• Track department-wide syllabus completion pace.<br>• Supervise semester examination and internal assessment schedules. | • `/dashboard/academic-admin`<br>• `GET /api/academic/student-syllabus`<br>• `POST /api/academic/syllabus/parse` |
| **L4** | **Faculty / Teacher** | • Manage active subjects, lecture notes, handouts, and live video rooms.<br>• Create and grade assignments; inspect student code/PDF submissions.<br>• Build interactive timed quizzes with automatic grading.<br>• Use AI Teaching Assistant for lesson plans and quiz question generation. | • `/dashboard/teacher`<br>• `POST /api/lms/subjects/:id/resources`<br>• `POST /api/lms/assignments/:id/submit`<br>• `POST /api/lms/quizzes/:id/attempt` |
| **L5** | **Student** | • Automatically receive accredited syllabus for verified profile (`Institution`, `Department`, `Programme`, `Semester`).<br>• Dedicated subject LMS rooms (Notes, PDFs, Recorded Videos, Live Sessions).<br>• Submit assignments and take timed mastery quizzes.<br>• Consult Socratic AI Tutor under active safety guardrails.<br>• Download study notes for 100% offline access. | • `/dashboard/student`<br>• `/subject/:subjectId`<br>• `GET /api/academic/student-syllabus`<br>• `POST /api/tutor/chat`<br>• `POST /api/lms/topics/:id/toggle-complete` |
| **Parent** | **Parent / Guardian** | • View-only verified progress digest (attendance percentage, mastered topics).<br>• Home study advisories from faculty with **zero PII leakage**. | • `/dashboard/guardian`<br>• `GET /api/guardian/:token` |

---

## 3. High-Concurrency & Enterprise Scaling Architecture

To support large concurrent traffic spikes (thousands of students submitting assignments or taking quizzes simultaneously), Vidyapath implements a **production-grade enterprise scaling stack**:

```
[Inbound Student / Teacher Traffic]
                 │
                 ▼
     [Reverse Proxy / Cloudflare Edge CDN]
                 │
                 ▼
  [Load Balancer Health Probes: /healthz & /readyz]
                 │
                 ▼
    [Token-Bucket Sliding-Window Rate Limiter]
       ├── Auth Endpoints: 20 req / 15 min
       ├── AI Tutor: 30 req / min burst
       └── General API: 300 req / min
                 │
                 ▼
    [Enterprise Idempotency Middleware]
       └── Intercepts 'Idempotency-Key' on mutating requests
           (Returns 'X-Cache: IDEMPOTENT-HIT' on duplicates)
                 │
                 ▼
      [Stateless Express REST Microservices]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 [Async Event Batch Queue] [Neon PostgreSQL / Store]
 (FIFO O(1) deduplication,  (ACID Transactions, SSL Encrypted)
  batch flush in chunks of 50)
```

### A. Load Balancing & Probes
- `GET /healthz`: Fast liveness probe for Kubernetes and cloud load balancers.
- `GET /readyz`: Readiness probe verifying memory headroom (<1GB heap), queue depth, and database connectivity.
- `GET /metrics`: Prometheus-ready telemetry (heap usage, RSS, active institutions, queue latency).

### B. Sliding-Window Rate Limiting (`server/middleware/rateLimiter.ts`)
- Prevents DDoS, brute-force attacks, and quota starvation.
- Sends standard RFC headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.

### C. Enterprise Idempotency (`server/middleware/idempotency.ts`)
- Any network hiccup that causes client retries on assignments, quizzes, or sync events passes an `Idempotency-Key` header.
- The server verifies keys against an in-memory TTL store. If already executed, it immediately returns the cached result (`X-Cache: IDEMPOTENT-HIT`), **preventing double-submissions, duplicate DB rows, or grade alterations**.

### D. Asynchronous Batch Queue (`server/services/queueService.ts`)
- Offline telemetry and quiz attempts are enqueued into a memory-efficient buffer with $O(1)$ deduplication.
- Flushed in chunks of 50 events per transaction to avoid database lock contention.

---

## 4. Free Tier to Enterprise Scale Matrix

Vidyapath operates on a **$0/month baseline** while remaining completely scalable to enterprise cloud infrastructure:

| Service | Free Tier Quota | Vidyapath Optimization Strategy | Enterprise Upgrade Path |
|---|---|---|---|
| **Groq Cloud** | • 1,000 requests/day<br>• 14,400 tokens/min<br>• 300 tokens/sec LLaMA 3.3 70B | Client-side `IndexedDB` semantic cache answers repeated questions in **0ms** with **0 tokens**. Student daily quota enforced (30 queries/day). | Dedicated Groq Cloud Enterprise TPU compute instance. |
| **ElevenLabs** | • 10,000 characters/month | **Smart Voice Router**: ElevenLabs handles short key takeaways (<120 chars); native browser `SpeechSynthesis` reads full lessons with **0 characters burned**. | ElevenLabs Enterprise Tier with custom voice clones. |
| **Neon PostgreSQL** | • 0.5 GB serverless storage<br>• SSL encrypted, auto-suspend | Compact schema with Unix timestamps. 80%+ of telemetry cached locally on device. | Multi-region Neon Serverless Postgres with read replicas. |
| **Cloudflare R2** | • 10 GB storage free/month<br>• **$0 egress bandwidth fees** | Syllabus PDFs and handouts served directly from Cloudflare R2 with zero bandwidth charges. | Cloudflare R2 with custom edge caching domains. |
| **EmailJS** | • 200 transactional emails/month | 6-digit OTP verification with 60s cooldown. Development mode uses audit logging simulation. | SendGrid / AWS SES dedicated SMTP relay. |
| **GitHub Actions** | • Unlimited Linux build minutes<br>• 2 GB release storage | Automated CI/CD builds and hosts Android APKs directly on GitHub Releases at $0 cost. | GitHub Enterprise self-hosted runner pool. |

---

## 5. Intelligent Student-Based Syllabus Matcher

Students never manually search through unrelated academic content.

1. When a student logs in, the engine reads their verified enrollment:
   $$\text{Student Profile} \longrightarrow (\text{Institution}, \text{Department}, \text{Programme}, \text{Semester})$$
2. The server dynamically resolves and returns their accredited subjects:
   - **CS501**: Operating Systems & Architecture (4 Credits)
   - **CS502**: Computer Networks & Protocols (4 Credits)
   - **CS503**: Database Management Systems (3 Credits)
3. If curriculum data is pending or unavailable, the system notifies the student and provides a one-click **"Request Syllabus"** action alerting the Department Head.

---

## 6. Responsible Socratic AI & Multi-Tier Safety Guardrails

AI functions as an educational coach, **never as a cheating device**. Enforced at the application and backend level in [`server/services/aiGuardrails.ts`](server/services/aiGuardrails.ts):

1. **Exam Integrity Guardrail**: Rejects requests for active exam solutions or test keys (`"Academic Integrity Notice: Vidyapath AI cannot assist during active examinations."`).
2. **Prompt Injection Defense**: Rejects system prompt extraction, rule overrides, and jailbreak commands.
3. **PII Masking**: Blocks queries containing phone numbers, passwords, or personal credentials.
4. **Answer Dumping Prevention**: Homework answer dumping is intercepted and converted into a **Socratic pedagogical nudge**:
   > *"Instead of solving your entire assignment directly, let's break down the method step-by-step: what is the primary formula you think applies here?"*
5. **Curriculum Grounding**: Prompts are dynamically grounded in the active subject and unit concepts.

---

## 7. 0-Data Offline First Architecture

Vidyapath remains fully functional even in rural regions with intermittent connectivity:

- **PWA Service Worker** ([`public/sw.js`](public/sw.js)): Pre-caches core application shell, fonts, and launch packs.
- **Local IndexedDB**: Stores downloaded notes, assignment drafts, and attempt logs.
- **Offline Learning Center** ([`src/screens/offline/OfflineLearningCenter.tsx`](src/screens/offline/OfflineLearningCenter.tsx)): Allows students to read downloaded materials and monitor cloud synchronization status.
- **Zero Data Loss Guarantee**: Local changes are timestamped and idempotently merged with the cloud when connectivity returns.

---

## 8. Complete API Reference

### Authentication & Account Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Email/password login with account lockout protection. |
| `POST` | `/api/auth/otp/send` | Dispatches 6-digit cryptographic OTP via EmailJS. |
| `POST` | `/api/auth/otp/verify` | Single-use verification of OTP. |
| `POST` | `/api/auth/register/institution` | Institution registration (enters Pending Approval state). |
| `POST` | `/api/auth/register/student` | Student registration linked to verified academic profile. |
| `GET` | `/api/auth/me` | Returns active user profile and role details. |

### Super Administration (Level 1)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/super-admin/institutions` | Lists all institutions with status filter. |
| `POST` | `/api/super-admin/institutions/:id/approve` | Approves institution and sends transactional confirmation. |
| `POST` | `/api/super-admin/institutions/:id/reject` | Rejects institution with feedback reason. |
| `GET` | `/api/super-admin/stats` | Global platform metrics. |
| `GET` | `/api/super-admin/audit-logs` | Security and operational audit log. |

### Academic & Syllabus Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/academic/student-syllabus` | Dynamically fetches verified student curriculum. |
| `POST` | `/api/academic/syllabus/parse` | Ingests raw text/document and extracts structured units. |
| `POST` | `/api/academic/syllabus/publish` | Publishes approved curriculum to active database. |

### Classroom LMS & Telemetry
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lms/subjects/:id/overview` | Subject LMS room: Units, Notes, Handouts, Videos, Live link. |
| `POST` | `/api/lms/subjects/:id/resources` | Teacher adds new classroom learning resource. |
| `POST` | `/api/lms/assignments/:id/submit` | Student submits assignment solution text or PDF link. |
| `POST` | `/api/lms/quizzes/:id/attempt` | Auto-grades student quiz submission with explanations. |
| `POST` | `/api/tutor/chat` | Guardrailed Socratic AI conversation. |

### Enterprise Health & Probes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Kubernetes liveness probe (200 OK). |
| `GET` | `/readyz` | Kubernetes readiness probe (memory & DB check). |
| `GET` | `/metrics` | Prometheus telemetry data. |

---

## 9. Verification & Automated Test Suite

Vidyapath maintains a comprehensive automated test suite with **100% pass coverage**:

```bash
# Run all test suites
npm test

# Production build check
npm run build

# Native Android capacitor sync
npx @capacitor/cli sync android
```

### Verified Test Workflows:
1. **Cryptographic Security**: PBKDF2 hashing, JWT signing, and signature tamper rejection.
2. **OTP Security**: Expiration, single-use invalidation, and 60-second resend cooldown.
3. **Multi-Tier Institution Approval**: Registration $\to$ Super Admin approval $\to$ Email notification.
4. **Dynamic Student Syllabus Matcher**: Automatic resolution of semester courses based on enrollment.
5. **Syllabus Parsing & Publication**: Structured unit extraction and database ingestion.
6. **LMS Assignment & Quiz Engine**: Online submission and automatic scoring with explanations.
7. **AI Pedagogical Guardrails**: Verified refusal of exam cheating, prompt injection, and PII extraction.
8. **High-Concurrency Scaling**: Idempotency key deduplication (`X-Cache: IDEMPOTENT-HIT`) and rate limiting (`X-RateLimit-*`).

---

## 10. Deployment Guide

### Local Development
```bash
git clone https://github.com/yynvr1408/vidhyapath.git
cd vidhyapath
npm install
npm run server   # Starts Express backend on port 3001
npm run dev      # Starts Vite frontend on port 5173
```

### Docker Deployment
```bash
docker-compose up --build -d
```

### Android Native APK
Built automatically via GitHub Actions CI/CD on every push to `main`. Download the signed APK directly from [GitHub Releases](https://github.com/yynvr1408/vidhyapath/releases/latest).

---

## 11. Built With

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript, tsx
- **Mobile Container**: Capacitor 8 (Android & iOS)
- **Database**: Serverless Neon PostgreSQL + IndexedDB (Local)
- **AI & Speech**: Groq Cloud LLaMA 3.3 70B, Groq Whisper Large v3, ElevenLabs Neural TTS, Web Speech API
- **Storage & CDN**: Cloudflare R2, EmailJS, GitHub Releases
