# Vidyapath — Database Architecture & Relational Schema

**Authoritative Datastore:** Serverless Neon PostgreSQL (SSL Encrypted, Pool Managed)  
**Client Datastore:** IndexedDB (`localDb` with Service Worker offline cache)

---

## 1. Domain ER Model Overview

The database is structured into 12 distinct functional domains:

```
+---------------------------------------------------------------------------------+
|                                 AUTHENTICATION                                  |
|  users <---> sessions <---> otp_verifications <---> password_reset_requests      |
+---------------------------------------+-----------------------------------------+
                                        |
     +----------------------------------+----------------------------------+
     |                                                                     |
     v                                                                     v
+----+-----------------------------+                     +-----------------+-----------------------------+
|              FAMILY              |                     |                  ACADEMICS                    |
|  families <---> family_members   |                     |  institutions <---> departments <---> prog    |
|  guardianships <-> consents      |                     |  academic_years <-> semesters <-> classes     |
+----+-----------------------------+                     +-----------------+-----------------------------+
     |                                                                     |
     +----------------------------------+----------------------------------+
                                        |
                                        v
+---------------------------------------+-----------------------------------------+
|                                    STUDENT                                      |
|  student_profiles <---> student_enrollments <---> student_academic_history      |
+---------------------------------------+-----------------------------------------+
                                        |
     +----------------------------------+----------------------------------+
     |                                                                     |
     v                                                                     v
+----+-----------------------------+                     +-----------------+-----------------------------+
|              COURSES             |                     |                    LEARNING                   |
|  courses <---> course_versions   |                     |  learning_resources <---> assignments         |
|  subjects <-> curriculum_units   |                     |  assignment_submissions <-> quizzes           |
|  curriculum_topics <-> lessons   |                     |  quiz_questions <-> quiz_attempts            |
+----+-----------------------------+                     +-----------------+-----------------------------+
     |                                                                     |
     +----------------------------------+----------------------------------+
                                        |
                                        v
+---------------------------------------+-----------------------------------------+
|                                   AI & TELEMETRY                                |
|  ai_conversations <-> ai_messages <-> ai_usage_records <-> sync_events          |
+---------------------------------------------------------------------------------+
```

---

## 2. Table Specifications

### 2.1 AUTHENTICATION
- `users`: Primary identity table (id, full_name, email, phone, role, status, password_hash, salt, created_at, last_login_at).
- `sessions`: Active JWT sessions with token hashes, expiration, and user agent.
- `otp_verifications`: Cryptographically generated 6-digit OTPs hashed with expiration (5 mins) and attempt counters.
- `password_reset_requests`: Password reset tokens with single-use flags.

### 2.2 FAMILY & GUARDIAN
- `families`: Represents family unit (id, name, owner_guardian_id, created_at).
- `family_members`: Links user to family (family_id, user_id, relationship_type, is_primary).
- `guardianships`: Verified parent-to-student relationship with permissions (view_progress, receive_alerts, consent_given).
- `guardian_consents`: Timestamped COPPA/FERPA consent logs.

### 2.3 INSTITUTIONS & ACADEMICS
- `institutions`: Multi-tenant organization profile (id, name, code, type, contact_email, status, ai_policy).
- `academic_years`: Institutional calendar periods (year_label, start_date, end_date, is_current).
- `departments`: Academic faculties (name, code, institution_id).
- `programmes`: Degree and grade tracks (e.g. Class 10 AP Board, B.Tech CSE).
- `semesters`: Specific term divisions.
- `classes` & `sections`: Classroom cohorts.

### 2.4 COURSES & CURRICULUM
- `courses`: Global or institutional courses (id, title, code, category, is_published, version).
- `course_enrollments`: Student subscription to courses.
- `subjects`: Course subjects (credits, syllabus_version, assigned_teachers).
- `curriculum_units`: Structured units within a subject.
- `curriculum_topics`: Specific conceptual topics linked to mastery tracking.
- `lessons`: Multilingual worked examples, concept explanations, and takeaway summaries.

### 2.5 LMS & STUDENT TELEMETRY
- `learning_resources`: Handouts, PDFs, and links stored via Cloudflare R2.
- `assignments`: Graded student homework and project specifications.
- `assignment_submissions`: Student submission records with feedback.
- `quizzes`: Formative and summative assessments.
- `quiz_attempts`: Auto-graded student submissions with distractor diagnostic analysis.

### 2.6 SOCRATIC AI TUTOR
- `ai_conversations`: Student-specific dialogue threads.
- `ai_messages`: User questions, Socratic hints, RAG context snippets, and voice transcripts.
- `ai_usage_records`: Token consumption tracking for Groq Cloud.

---

## 3. Data Integrity & Security Guarantees
- **Cascading Constraints**: Deleting a test student profile safely cascades to attempts while archiving academic audit logs.
- **Audit Trails**: Critical security actions (logins, password resets, role grants) write immutably to `audit_logs`.
- **Zero Ephemeral Writes**: All document uploads route through `multer.memoryStorage()` directly to Cloudflare R2.
