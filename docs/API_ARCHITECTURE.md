# Vidyapath API

The Express API is deployed from `backend/` and serves `/api/*`. Website requests use the same-origin Netlify proxy in production or the Vite proxy in local development.

## Authentication

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Sign in through the shared website authentication flow. |
| `POST` | `/api/auth/register/student` | Register a student account. |
| `POST` | `/api/auth/register/guardian` | Register a guardian account. |
| `POST` | `/api/auth/register/institution` | Submit an institution for super-admin approval. |
| `POST` | `/api/auth/register/teacher` | Reject public teacher registration; staff must invite teachers. |
| `POST` | `/api/auth/otp/send`, `/api/auth/otp/verify` | Email verification for registration and account recovery. |
| `GET` | `/api/auth/me` | Return the active account and role from the database. |

## Academic structure and curriculum

| Method | Route | Access |
|---|---|---|
| `GET` | `/api/institution/:id/departments` | Authenticated users in the institution; super-admin may view across tenants. |
| `POST` | `/api/institution/:id/departments` | Super-admin, institution admin, or academic admin in scope. |
| `GET` | `/api/institution/:id/programmes` | Authenticated users in the institution; super-admin may view across tenants. |
| `POST` | `/api/institution/:id/programmes` | Super-admin, institution admin, or academic admin in scope. |
| `GET` | `/api/academic/student-syllabus` | Authenticated student or scoped teaching/admin account. |
| `POST` | `/api/academic/syllabus/parse` | Super-admin, institution admin, or academic admin; validates real department, programme, semester, and source content. |
| `POST` | `/api/academic/syllabus/publish` | Same roles; validates hierarchy and stores the published subject in PostgreSQL. |

## Role-protected areas

- `/api/super-admin/*` checks the live `super_admin` role.
- `/api/family/*` checks guardian/student ownership for each linked learner.
- `/api/lms/*` checks roles, assigned subjects, and enrolled learner programme before exposing or changing course data.
- `/api/announcements` requires a signed-in account and filters by the account's institution and role.
- `/api/sync` verifies that submitted learning events belong to the active learner.

All signed-in routes require `Authorization: Bearer <token>`. The API refreshes role and institution scope from the current user record instead of trusting stale JWT role claims.
