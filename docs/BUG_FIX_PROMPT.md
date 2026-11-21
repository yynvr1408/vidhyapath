# Vidyapath Bug-Fix Prompt (for a separate session)

> This is a **prompt for a separate session**. Paste everything below the line into a new agent session. It is self-contained. Do not run it inside the audit session that produced it.

---

## 1. Context

Vidyapath is an installable React + Vite PWA for offline-first maths practice (Class 10, Telugu, AP State Board). It has:

- **Frontend:** React + Vite PWA in `src/` (IndexedDB, Service Worker, sync outbox).
- **Backend:** Express API in `server/` (TypeScript), backed by Neon Postgres.
- **Mobile:** Capacitor Android wrapper.
- **Host OS:** Windows. Use Windows-compatible shell commands and path separators.

Verification commands (run from the project root in PowerShell or cmd):

```
npm run build
npm test
npx tsx tests/vidyapath_audit_test.ts
```

Source of findings: a static audit (read-only, no runtime runs). Treat every item as **unverified until a test or manual check reproduces it**.

---

## 2. Findings

Status key: **CONFIRMED** = visible in code by static reading. **SUSPECTED** = needs runtime or production-config confirmation. **DECISION** = needs a team decision before code change.

| ID | Location | Status | Description |
|---|---|---|---|
| AUDIT-01 | `server/index.ts` (routes `/api/admin/packs`, `/validate`, `/publish`) | CONFIRMED | Admin pack routes have no auth or PIN check; publish writes files to disk. |
| AUDIT-02 | `server/index.ts` (route definitions) | CONFIRMED | `authRateLimiter` and `tutorRateLimiter` are defined but unused; login, OTP and tutor routes get only the general limit. |
| AUDIT-03 | `server/services/auth.ts` | CONFIRMED | JWT secret falls back to a hardcoded string when the env var is missing. |
| AUDIT-04 | `server/index.ts` ~407 (check-update route) | CONFIRMED | Route returns `err.message` to the client. |
| AUDIT-05 | `server/index.ts` ~412-436 (guardian token route) | CONFIRMED | Token lookup does not check `expiresAt`; tokens never expire or get revoked. |
| AUDIT-06 | `server/index.ts` ~440-446 (sponsor cohort) | CONFIRMED | Cohort threshold uses a stored `activeLearners` number, not a live count. |
| AUDIT-07 | `src/components/PinPadModal.tsx:58` | CONFIRMED | Fixed PIN `1234` is accepted for any learner. |
| AUDIT-08 | `src/db/indexedDb.ts` ~160-169; `src/services/sync.ts` ~24, 33-38 | CONFIRMED | `getOutboxAttempts` has no `learnerId` filter; sync sends all pending events under the current learner. |
| AUDIT-09 | `src/db/indexedDb.ts` ~96-105 (`deleteLearner`) | CONFIRMED | Deleting a learner leaves skill states, attempts, outbox rows and doubts behind. |
| AUDIT-10 | `src/screens/S5_PracticeScreen.tsx:73`; `src/screens/PracticeWeakTopicsScreen.tsx:73` | CONFIRMED | Attempt IDs are `Date.now()` plus random, not UUIDs; README requires client UUIDs. |
| AUDIT-11 | `src/engine/practiceEngine.ts` ~22-23 | DECISION | Mastery is clamped to a 0.05 minimum, which the README formula does not specify. |
| AUDIT-12 | `src/screens/offline/OfflineLearningCenter.tsx:46-67` | CONFIRMED | "Sync now" posts empty events and doubts, so it never flushes the outbox, yet reports success. |
| AUDIT-13 | `src/screens/S5_PracticeScreen.tsx` ~87-88 | CONFIRMED | DB writes are awaited with no try/catch. |
| AUDIT-14 | `src/components/EnterpriseShell.tsx` ~155, 180, 209, 211, 228, 261, 287, 329, 338 | CONFIRMED | Hard-coded English strings bypass `translations.ts`. |
| AUDIT-15 | `src/App.tsx` ~38-60 (hash routes); `src/components/EnterpriseShell.tsx` (demo switcher) | SUSPECTED | Hash routes have no role check. Demo role switcher logs in as any role with `password123`; must be confirmed to be a risk in production builds. |
| AUDIT-16 | `src/screens/PracticeWeakTopicsScreen.tsx` ~170, ~283, ~318 | CONFIRMED | Back button is `min-h-[44px]`; README requires 56px touch targets on practice screens. Next and hint buttons are `py-3` only. |

---

## 3. Expected fixed behaviour (one sentence each)

- **AUDIT-01:** Every admin pack route requires a valid admin credential, and publish is refused without it.
- **AUDIT-02:** Login, OTP and tutor routes are wrapped by their dedicated rate limiters.
- **AUDIT-03:** The server refuses to start in production if the JWT secret env var is missing.
- **AUDIT-04:** The check-update route returns a generic error message and logs the detail server-side.
- **AUDIT-05:** Guardian tokens are rejected once `expiresAt` has passed, and can be revoked.
- **AUDIT-06:** The sponsor cohort threshold is computed from a live count of active learners.
- **AUDIT-07:** PIN validation checks the learner's own PIN, and the fixed `1234` is removed.
- **AUDIT-08:** `getOutboxAttempts` filters by `learnerId`, and sync sends only the current learner's pending events.
- **AUDIT-09:** `deleteLearner` removes that learner's skill states, attempts, outbox rows and doubts in one transaction.
- **AUDIT-10:** New attempt IDs are client-generated UUIDs.
- **AUDIT-11:** Team decides; either the 0.05 floor is documented in the README or it is removed to match the formula.
- **AUDIT-12:** "Sync now" flushes the real outbox and reports success only when the flush succeeds.
- **AUDIT-13:** DB write failures in practice are caught, shown to the learner, and do not crash the screen.
- **AUDIT-14:** All shell strings are read from `translations.ts` in both languages.
- **AUDIT-15:** Hash routes check role before rendering, and the demo password switcher is compiled out or disabled in production builds.
- **AUDIT-16:** Practice back, Next and hint buttons are at least 56px tall.

---

## 4. Rules for the fixing agent

1. **Minimal changes only.** Touch only the lines needed for each finding.
2. **Never rename identifiers.** Keep exported names, route paths and DB field names unchanged.
3. **Do not change** the deterministic answer checker, the 60/25/15 adaptive selection, or the 120-word tutor cap.
4. **Verify after each fix round**, in this order:
   - `npx tsx tests/vidyapath_audit_test.ts`
   - `npm test`
   - `npm run build`
5. **Stop after 2 fix rounds.** Then report which findings still fail, with the failing test name and file.
6. **Do not** delete tests to make them pass. If a test is wrong, say so in the report.
7. **AUDIT-11 and AUDIT-15 production check:** do not change behaviour until the team has decided (AUDIT-11) or the production build has been inspected (AUDIT-15).
8. Report per finding: ID, status (fixed / still failing / deferred), files changed.

---

## 5. Notes on this prompt

- This prompt was generated by a read-only static audit. No code was run, and no existing file was modified by the audit.
- All statuses in section 2 come from static reading. Runtime behaviour is unverified until the commands in section 1 are run.
- Confirmed items are fix candidates. Suspected and decision items need the check or sign-off named in their rows before code changes.
