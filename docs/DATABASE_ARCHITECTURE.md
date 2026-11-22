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

## 2. Table Specifications (27 Production Relational Tables)

The authoritative Neon PostgreSQL schema defines **27 production relational tables** fully integrated with memory-to-disk listeners and startup hydration (`hydrateStoreFromNeon`):

### 2.1 AUTHENTICATION & ACCESS CONTROL
1. `users`: Multi-tier enterprise accounts, password hashes (PBKDF2 10,000 iterations), salt, profile metadata, roles, and status.
2. `otp_verifications`: Cryptographically secure 6-digit verification codes with rate limits and SHA-256 hashes.
3. `audit_logs`: Immutable security, academic, and administrative event log with actor ID, action, category, and JSON payload.

### 2.2 FAMILY & GUARDIANSHIP (Zero-PII Student Architecture)
4. `families`: Primary family accounts linked to primary guardians.
5. `family_members`: Links users (guardians and siblings) to families with role segregation.
6. `guardianships`: Verified parent-to-student relationship ensuring sibling data isolation.

### 2.3 INSTITUTION & ACADEMIC HIERARCHY
7. `institutions`: Multi-tenant organization profile (code, name, verification status, contact email, custom domains).
8. `academic_years`: Institutional calendar periods and term flags.
9. `departments`: Academic faculties under direct institutional oversight.
10. `programmes`: Degree and grade tracks (e.g. Class 10 AP Board, B.Tech CSE).

### 2.4 COURSES & CURRICULUM MANAGEMENT
11. `courses`: Centralized curriculum catalog with direct L2 Institution Administrator control.
12. `course_enrollments`: Student course subscriptions and progress tracking.
13. `subjects`: Curricular subjects with credit allocations and syllabi versions.
14. `curriculum_units`: Modular learning units within academic subjects.

### 2.5 LMS LEARNING RESOURCES & ASSESSMENTS
15. `learning_resources`: Handouts, guides, PDFs, and multimedia backed by Cloudflare R2 object storage.
16. `assignments`: Graded coursework with institution validation and due dates.
17. `assignment_submissions`: Student submission records with R2 asset attachments and grading feedback.
18. `quizzes`: Formative and summative diagnostic assessments.
19. `quiz_attempts`: Auto-graded attempts with distractor analysis and mastery updates.

### 2.6 COMMUNICATION & INSTITUTIONAL POLICY
20. `announcements`: Broadcast announcements across departments, grades, or campus-wide.
21. `notifications`: Multi-channel in-app alerts and notifications.
22. `ai_policies`: Institutional AI guardrails, strict language policies, and subject restrictions.

### 2.7 AI TUTOR & TELEMETRY
23. `ai_conversations`: Multi-turn Socratic dialogue threads per student and topic.
24. `ai_messages`: Dialogue turns, hints, RAG context snippets, and voice transcripts.
25. `sync_events`: Offline learning events synced from IndexedDB outbox.
26. `doubts_queue`: Offline doubt queue with trilingual resolution.
27. `cohort_aggregates`: Anonymized analytics and performance benchmarks.

---

## 3. Data Integrity & Security Guarantees
- **Cascading Constraints**: Deleting a test student profile safely cascades to attempts while archiving academic audit logs.
- **Audit Trails**: Critical security actions (logins, password resets, role grants) write immutably to `audit_logs`.
- **Zero Ephemeral Writes**: All document uploads route through `multer.memoryStorage()` directly to Cloudflare R2.
- **Bidirectional Hydration**: 27 ObservableMaps automatically mirror memory mutations into PostgreSQL and hydrate on cold boot.
