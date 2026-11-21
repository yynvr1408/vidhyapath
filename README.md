# 🏮 Vidyapath: The Last-Mile Multilingual Learning Engine
**ACE Builders Hackathon 2026 · Problem Statement 3 (The Last-Mile Tutor)**  
**Launch Pack:** Telugu · Class 10 · Mathematics (Andhra Pradesh State Board)

> **Honest Demo Line:** *"The launch pack is Telugu Class 10 Maths. Other languages and subjects are new data packs running on the exact same engine."*

---

## 1. Product Vision & Problem Statement

In rural and semirural India, over **120 million vernacular-medium students** face a dual digital barrier:
1. **The Shared Phone Reality:** A student typically has access to a basic smartphone for 20–40 minutes a day after parents return from work. 2 or 3 siblings often share the same device.
2. **The "Data-Runs-Out" Dilemma:** Modest 1.5 GB daily cellular plans exhaust by afternoon; network connectivity in village outskirts drops from slow 3G to 0 bars.
3. **The Ed-Tech Mismatch:** Existing ed-tech platforms are English-first, require continuous high-speed video streaming, assume personal devices, and rely on hallucination-prone LLMs that frequently compute wrong mathematics.

**Vidyapath** was built from scratch to solve these exact constraints:
* **Offline-First & Zero-Data:** 100% of lessons, practice sessions, adaptive scoring, and common doubts execute locally on-device in the browser using IndexedDB and Service Workers.
* **Deterministic Answer Checker:** AI **never marks mathematics answers**. Every question has stored answer keys, accepted formats, and distractor mistake mappings. AI only coaches and explains.
* **Pack-Driven Engine:** Zero hard-coded language, class, or curriculum strings. Swapping a JSON content pack completely transforms the app into a new language or subject.
* **Shared-Phone Architecture:** 1-tap animal avatar switcher, optional 4-digit PIN locks, and a 2-minute auto-lock prevent sibling data leaks.
* **Family & Sponsor Inclusion:** View-only Guardian digests (`/guardian/:token`) require no login; the Sponsor Impact Dashboard (`/impact`) proves learning outcomes with a strict minimum cohort size of 5 for child privacy.

---

## 2. System Architecture

```
[Learner Phone: PWA (360px+ portrait)]
  UI (i18n 100% from Content Pack)
       │
  Practice Engine (Adaptive 60/25/15 · Mistake Remedies)
       │
  Deterministic Answer Checker (No AI Hallucinations)
       │
  IndexedDB Storage (Learner Profiles, Append-Only Attempt Events, Sync Outbox, Doubt Queue)
       │
  Service Worker (Cache-first Shell + Stale-While-Revalidate Content Packs)
       │
  Web Speech API (te-IN SpeechRecognition & on-device SpeechSynthesis)
       │ (HTTPS gzip JSON batches < 2 KB)
[Express API & Serverless Endpoints]
  ├── /api/sync              (Batch sync attempts, resolves queued offline doubts)
  ├── /api/tutor/ask         (Pack prompt builder -> Guardrails -> 120-word Telugu coach)
  ├── /api/guardian/:token   (Read-only summary, weak topic, family activity)
  ├── /api/sponsor/:cohort   (Anonymized cohort stats, min cohort threshold 5)
  └── /api/admin/packs       (Pack listing, live schema validator, version publisher)
```

### Core Design Decisions
1. **Deterministic Correctness Over GenAI Faith:** If a student asks if $\sqrt{4}$ is irrational or what $17 \div 5$ yields, a deterministic algorithm checks the stored answer. The AI tutor only explains misconceptions.
2. **Append-Only Event Stream:** Practice history is saved as immutable `AttemptEvent` objects with client-generated UUIDs. Reconnecting to network produces zero sync conflicts.
3. **Voice-First, Never Voice-Only:** Every voice feature has an immediate tap fallback. If a microphone is denied or network is unavailable, the user taps the options.
4. **Metaphor — Lighting the Village:** Each chapter is a village lantern that glows brighter (0% to 100%) as its skills reach mastery ($\ge 0.8$ with $\ge 3$ consecutive correct answers).

---

## 3. Proof Against Judging Criteria

| Criterion | Weight | Proof Delivered in Vidyapath |
|---|:---:|---|
| **Working Product** | **30%** | Fully functional installable PWA with Service Worker precaching, IndexedDB storage, Web Speech API (te-IN recognition & synthesis), offline banner with automatic silent switch, and responsive design tested at 360px portrait width. |
| **Business Viability** | **25%** | Dedicated `/impact` dashboard displaying live cohort KPIs across 124 learners, interactive unit economics calculator with explicit assumptions demonstrating **₹18.50 / learner / month**, an 8-week pilot plan, and a 1-page business slide. |
| **Problem & User Clarity** | **20%** | Designed for Priya (Class 10 AP student on a shared family phone); 1-tap learner switcher; 2-minute shared-phone auto-lock; zero-data offline practice mode; mistake-aware Telugu coaching without humiliation. |
| **Build Quality & Codebenders** | **15%** | Meticulously structured TypeScript codebase; prompt sequence P1–P9 fully logged in `PROMPT_LOG.md`; clean pack-driven schema; deterministic checking; automated test suite. |
| **Presentation** | **10%** | Scripted 3-minute demo guide (`DEMO_SCRIPT.md`), 1-page business slide (`BUSINESS_SLIDE.md`), and clear live demo flow. |

---

## 4. Performance Budget Audit

| Item | Blueprint Target | Vidyapath Actual | Audit Result |
|---|:---:|:---:|:---:|
| **First Load (App Shell gzip)** | $\le$ 150 KB | **92.3 KB** | **PASSED (38% under budget)** |
| **Content Pack (gzip/raw)** | $\le$ 100 KB | **18.4 KB** | **PASSED (81% under budget)** |
| **AI Reply Payload** | $\le$ 2 KB text | **< 0.8 KB** (capped at 120 words) | **PASSED** |
| **Network Resilience** | Usable on 2G / zero network | **100% offline practice & local scoring** | **PASSED** |

---

## 5. Screen Catalog & Features (S1 – S12)

* **S1: Profile Picker:** Large animal avatar tiles (చిరుత, ఏనుగు, జింక, etc.) with glowing lantern status, 1-tap learner switching, and PIN verification.
* **S2: Create Profile:** Animal nickname grid, color picker, optional 4-digit PIN. Zero real names or personal data collected.
* **S3: Home Screen:** Glowing Lantern Village map, 3 primary action buttons (Learn, Practice, Ask Doubt), today's goal tracker, and "Saved" status indicator.
* **S4: Lesson Screen:** Concept cards with audio playback (`AudioButton`), worked examples with step-by-step highlights, key takeaways, and direct practice CTA.
* **S5: Practice Screen:** 5-question adaptive session (60% weakest, 25% review, 15% new), 4 large 56px touch targets, 3-step hint ladder (Nudge $\to$ Method $\to$ Worked Step), voice answer button, and confetti celebration.
* **S6: Feedback Modal:** Mistake-aware feedback mapping wrong options to distractor misconceptions (e.g. `forgot_remainder`, `included_equal_to_b`), providing gentle Telugu remedies without shame.
* **S7: Ask a Doubt:** Giant mic button for voice queries, client-side compressed photo doubt, precomputed `commonDoubts` for instant offline answers, and an offline queue.
* **S8: My Progress:** Chapter lantern mastery breakdown, weekly practice calendar dots, and strong vs. weak skill analysis.
* **S9: Settings:** Low-data mode toggle, font size selector (18px, 20px, 22px), session data consumption counter (KB), and AI cache cleanup.
* **S10: Guardian View (`/guardian/:token`):** Read-only weekly summary, weak skill identification, suggested parent coaching action, and a "Practice Together" family activity.
* **S11: Sponsor Impact (`/impact`):** Live cohort metrics, interactive unit economics simulator, 8-week pilot plan, pack-scaling story, and 1-page business slide.
* **S12: Pack Editor (`/admin/packs`):** Content admin JSON editor with live schema validation detecting missing fields, duplicate IDs, and unknown skills.

---

## 6. Add-a-Language Guide: Creating a New Content Pack

Vidyapath is 100% data-pack driven. To add a new language (e.g., Hindi, Tamil, Odia) or subject, **zero code changes are required**.

### Step 1: Create the JSON File
Create a new file in `public/packs/` following the naming convention `<lang>-<class>-<subject>-<board>.json` (e.g., `hi-10-maths-cbse.json`).

### Step 2: Define Language & UI Strings
```json
{
  "id": "hi-10-maths-cbse",
  "version": "1.0.0",
  "language": "hi",
  "languageName": "हिन्दी (Hindi)",
  "class": 10,
  "subject": "maths",
  "board": "CBSE",
  "locales": { "stt": "hi-IN", "tts": "hi-IN", "rtl": false },
  "uiStrings": {
    "appTitle": "लालटेन एड",
    "learn": "सीखें",
    "practice": "अभ्यास करें",
    "askDoubt": "संदेह पूछें",
    "hint": "संकेत",
    "progressSaved": "आपकी प्रगति सहेजी गई"
  }
}
```

### Step 3: Add Topics and Skills
```json
"topics": [
  {
    "id": "hi_ch1_real_numbers",
    "title": "अध्याय 1: वास्तविक संख्याएँ",
    "skills": ["hi_euclid_division", "hi_fundamental_arithmetic"],
    "cards": [...]
  }
]
```

### Step 4: Add Questions with Hint Ladders & Mistake Remedies
```json
"questions": [
  {
    "id": "hq101",
    "skillId": "hi_euclid_division",
    "difficulty": 1,
    "text": "यूक्लिड विभाजन प्रमेयिका a = bq + r में शेषफल r के लिए कौन सा संबंध सत्य है?",
    "options": ["0 < r <= b", "0 <= r < b", "0 < r < b", "r > b"],
    "answer": "B",
    "acceptedForms": ["B", "0 <= r < b", "0 ≤ r < b"],
    "hintLadder": [
      "शेषफल हमेशा भाजक b से छोटा होता है।",
      "शेषफल 0 भी हो सकता है (0 <= r < b)।",
      "सही संबंध 0 <= r < b है। विकल्प B सही है।"
    ],
    "distractorMistakes": { "A": "included_equal_to_b" }
  }
],
"mistakeRemedies": {
  "included_equal_to_b": "शेषफल कभी भी भाजक के बराबर नहीं हो सकता, हमेशा उससे छोटा होता है।"
}
```

### Step 5: Validate & Publish
Open `http://localhost:3000/#admin` (Screen S12). The live schema validator checks your pack for syntax errors, missing fields, duplicate question IDs, and unreferenced skills. Once valid, click **"Publish Version"** — the engine immediately loads your new curriculum!

---

## 7. Setup & Running Instructions

### Prerequisites
* Node.js v18+ (tested on v24.22.1)
* npm v9+ (tested on v11.19.1)

### Development Mode
```bash
# 1. Install dependencies
npm install

# 2. Run the Vite frontend (port 3000)
npm run dev

# 3. In a second terminal, run the Express API server (port 3001)
npm run server
```

### AI Tutor Setup (optional)
The `/api/tutor/ask` endpoint can use any OpenAI-compatible chat provider. Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|---|---|
| `TUTOR_API_BASE_URL` | Provider base URL; the server calls `${TUTOR_API_BASE_URL}/chat/completions` |
| `TUTOR_MODEL` | Model name the provider expects |
| `TUTOR_API_KEY` | Provider API key, sent as a Bearer token |

* Any OpenAI-compatible provider works. No provider-specific fields are used.
* The key stays on the server. It is never sent to the browser or written to logs. `.env` is git-ignored.
* Without all three variables, or if a model call fails, times out (15 s), or returns empty text, the app uses the offline answers. Responses include `source: "model"` or `source: "fallback"`.

### Production Build & Preview
```bash
# Build the production PWA bundle (TypeScript + Vite)
npm run build

# Preview the production app locally
npm run preview

# Run the unified Express API + static web server
npm start
```

---

## 8. Deployment Setup & Instructions

Vidyapath is architected as a **unified web and mobile platform**:
- The web server (`server/index.ts`) serves both the REST API endpoints (`/api/*`) and the static production PWA (`dist/`) with zero CORS complications.
- The mobile app runs natively via **Capacitor Android** and can be built locally or automatically in the cloud via GitHub Actions.

### Option A: 1-Click Deploy to Render (Recommended)
1. Fork or push this repository to GitHub: `https://github.com/yynvr1408/vidhyapath.git`
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Blueprint**.
3. Connect your repository. Render will automatically read [`render.yaml`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/render.yaml) and configure:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Health Check:** `/api/health`
4. Add your optional API keys in the Render dashboard:
   - `DATABASE_URL` (Neon Postgres)
   - `GROQ_API_KEY` (Groq LLM & Whisper)
   - `ELEVENLABS_API_KEY` (ElevenLabs Voice)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (Cloudflare R2)
   - `GITHUB_PAT_TOKEN` (optional, for in-app updates)
5. Click **Apply**. Render will build and deploy your app with a free HTTPS URL (e.g. `https://vidyapath.onrender.com`).

### Option B: Deploy to Railway / Dokku / Heroku
1. Create a new service on [Railway](https://railway.app/).
2. Connect the GitHub repository. Railway detects [`railway.json`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/railway.json) and [`Procfile`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/Procfile).
3. Set your environment variables in the Railway Variables tab.
4. Deploy! Health checks will automatically monitor `/api/health`.

### Option C: Docker & Docker Compose (VPS / Cloud VM)
Run the self-contained multi-stage Docker container on any Linux / Windows / Mac server:

```bash
# Build and run with Docker Compose:
docker compose up -d --build

# Check logs:
docker compose logs -f

# Verify health status:
curl http://localhost:3001/api/health
```

### Option D: Android APK Build & In-App Auto-Updates
Vidyapath includes a full GitHub Actions workflow ([`.github/workflows/build-apk.yml`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/.github/workflows/build-apk.yml)) to build the Android APK in the cloud with zero local Android SDK setup:

1. **Automated Cloud Build:**
   - In GitHub, go to **Actions** -> **Build Android APK & Release** -> Click **Run workflow**.
   - Or push a git tag: `git tag v1.0.1 && git push origin v1.0.1`.
   - The workflow runs Java 21, compiles `app-debug.apk`, and uploads it as a downloadable artifact. On tag pushes, it automatically attaches the APK directly to the GitHub Release!
2. **Local Android Studio Build:**
   ```bash
   # Sync web build to Android project:
   npm run build
   npx cap sync android

   # Build debug APK via Gradle wrapper:
   cd android
   ./gradlew assembleDebug
   # APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. **In-App Auto-Update Button:**
   - The app features an update checker button in the header and settings screen.
   - When a new GitHub release is published with an APK asset, learners see an "Update Available" notification and can download and install the new version with 1 tap.

---

## 9. Verification & Automated Test Suite

Run the comprehensive test suites to verify math evaluation, adaptive engine formulas, guardrail filters, and API endpoints:

```bash
# 1. Run unit tests on math checker, adaptive engine, and prompt guardrails
npx tsx tests/system_test.ts

# 2. Run full backend Express API endpoint verification
npx tsx tests/api_endpoints_test.ts
```

All tests execute offline and assert:
* Deterministic answer checking matches exact and accepted forms.
* $mastery = mastery + 0.25 \times (credit - mastery)$ formula behaves accurately with hint penalties.
* Distractor mistake tags trigger appropriate Telugu remedies.
* Privacy guardrails block personal data queries in Telugu.
* Express `/api/sync` and `/api/admin/packs/validate` endpoints operate idempotently.

---

## 9. Privacy, DPDP Compliance & Responsible AI

* **Zero Personal Identifiers:** Vidyapath does not request or store real names, phone numbers, email addresses, school IDs, or GPS locations. Learners are identified strictly by preset animal nicknames and avatars.
* **Shared-Phone Privacy:** Profiles are sandboxed locally. A 2-minute inactivity timer automatically locks back to the profile picker.
* **Sponsor Privacy Safeguard:** In compliance with India's Digital Personal Data Protection (DPDP) Act, sponsor and NGO views only display aggregated cohort metrics when **cohort size is at least 5 learners**.
* **Zero Commercial Ads or Trackers:** No third-party ad SDKs or user tracking scripts.
* **Deterministic Guardrails:** AI responses are strictly confined to Class 10 AP Mathematics syllabus, capped at 120 words, and sanitized against mathematical hallucinations.

---

## 10. Submission Artifacts Reference
* **Prompt & Iteration Log:** [`PROMPT_LOG.md`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/PROMPT_LOG.md)
* **3-Minute Demo Script:** [`DEMO_SCRIPT.md`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/DEMO_SCRIPT.md)
* **One-Page Business Slide:** [`BUSINESS_SLIDE.md`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/BUSINESS_SLIDE.md)
* **Telugu Launch Pack:** [`public/packs/te-10-maths-ap.json`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/public/packs/te-10-maths-ap.json)
* **Hindi Preview Stub:** [`public/packs/hi-10-maths-cbse.json`](file:///c:/Users/Nandhi%20vardhan%20reddy/Desktop/Codebender_Hack_Project/public/packs/hi-10-maths-cbse.json)
