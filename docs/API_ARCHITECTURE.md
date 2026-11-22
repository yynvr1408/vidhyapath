# Vidyapath — Complete API Architecture

**Protocol:** RESTful HTTPS  
**Default Port:** 3001  
**Authentication Scheme:** `Bearer <JWT_TOKEN>` with PBKDF2/Argon2id credential verification

---

## 1. API Route Index

### 1.1 Authentication & Profile Recovery
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/student` | Registers student (institutional or independent) | No |
| `POST` | `/api/auth/register/parent` | Registers parent and establishes family account | No |
| `POST` | `/api/auth/register/teacher` | Submits teacher registration for admin approval | No |
| `POST` | `/api/auth/register/institution` | Submits new institution application to Super Admin | No |
| `POST` | `/api/auth/login` | Unified email/password login with role redirection | No |
| `POST` | `/api/auth/otp/send` | Dispatches 6-digit OTP using EmailJS Template 1 | No |
| `POST` | `/api/auth/otp/verify` | Validates OTP for registration or email change | No |
| `POST` | `/api/admin/auth/forgot-password` | Dispatches password reset OTP using EmailJS Template 2 | No |
| `POST` | `/api/admin/auth/reset-password` | Verifies reset code and updates password hash | No |
| `GET` | `/api/auth/me` | Fetches active user profile and effective permissions | Yes (Any) |

### 1.2 Family & Guardian Management
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/family/create` | Initializes family entity for authenticated parent | Yes (Parent) |
| `POST` | `/api/family/add-student` | Adds new child student profile under family | Yes (Parent) |
| `POST` | `/api/family/link-student` | Requests link to existing institutional student code | Yes (Parent) |
| `GET` | `/api/family/children` | Retrieves all children linked to parent with progress | Yes (Parent) |
| `DELETE` | `/api/family/children/:id` | Revokes guardian relationship | Yes (Parent) |

### 1.3 Super Administration (L1)
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/super-admin/stats` | Aggregated platform statistics from real DB | Yes (Super Admin) |
| `GET` | `/api/super-admin/institutions` | List all institutions with status filter | Yes (Super Admin) |
| `POST` | `/api/super-admin/institutions/:id/approve` | Approves institution and sends Template 3 email | Yes (Super Admin) |
| `POST` | `/api/super-admin/institutions/:id/reject` | Rejects institution with feedback reason | Yes (Super Admin) |
| `POST` | `/api/super-admin/courses/publish` | Creates and publishes global platform course | Yes (Super Admin) |

### 1.4 Institution Administration (L2) — Direct Academic Control
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/institution/:id/overview` | Institutional performance, enrollment & metrics | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/departments` | Creates academic department | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/programmes` | Creates degree or grade programme | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/classes` | Provisions class section and cohort | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/subjects` | Provisions subject and curriculum mapping | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/assign-teacher` | Assigns teacher to subject/class | Yes (Inst Admin) |
| `POST` | `/api/institution/:id/adopt-course` | Adopts global platform course for institution | Yes (Inst Admin) |

### 1.5 Socratic AI Tutor & Multilingual Engine
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/tutor/ask` | Socratic dialogue adhering strictly to `te`, `hi`, `en` | Optional / Local |
| `POST` | `/api/tutor/voice-doubt` | Multi-part audio doubt $\to$ Whisper STT $\to$ Answer | Optional / Local |
| `POST` | `/api/tutor/conversations/:id` | Persists conversation history per student | Yes (Student) |

### 1.6 App Update & Telemetry
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/app/check-update` | Returns latest version and GitHub release info | No |
| `POST` | `/api/sync` | Processes batch offline attempts and queued doubts | Optional / Local |
| `GET` | `/healthz` & `/readyz` | Cloud platform liveness and readiness probes | No |
