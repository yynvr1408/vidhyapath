# 🏮 Vidyapath (विद्याపథ) · The Last-Mile Multilingual Learning Engine
**ACE Builders Hackathon 2026 · Problem Statement 3: The Last-Mile Tutor**  
*Empowering India's next 120M vernacular learners on shared basic smartphones with poor connectivity.*

[![CI/CD Automated Build & Release](https://github.com/yynvr1408/vidhyapath/actions/workflows/build-apk.yml/badge.svg)](https://github.com/yynvr1408/vidhyapath/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/yynvr1408/vidhyapath?color=green&label=Android%20APK)](https://github.com/yynvr1408/vidhyapath/releases/latest)
[![APK Size](https://img.shields.io/badge/APK%20Size-4.07%20MB-blue)](https://github.com/yynvr1408/vidhyapath/releases/download/v1.0.0/vidyapath-app.apk)
[![Offline Capability](https://img.shields.io/badge/Offline%20First-100%25-brightgreen)](https://github.com/yynvr1408/vidhyapath)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **🎯 The Core Thesis:**  
> *"True educational equity is not just translating English into regional subtitles. It is building an engine that runs in the learner's mother tongue, works on a single budget phone shared by 3 siblings, costs near-zero cellular data, and guides students with an empathetic AI tutor even when cell towers fail."*

---

## 🏆 Proof Against Judging Criteria

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           JUDGING EVALUATION MATRIX                            │
├──────────────────────────────┬───────────┬─────────────────────────────────────┤
│ Evaluation Criteria          │ Weightage │ How Vidyapath Wins                  │
├──────────────────────────────┼───────────┼─────────────────────────────────────┤
│ 1. Working Product           │    30%    │ Production PWA + Live Android APK   │
│ 2. Business Viability        │    25%    │ ₹18.50/mo Unit Economics + B2B2C    │
│ 3. Problem & User Clarity    │    20%    │ Shared-Phone UX + Mistake Coaching  │
│ 4. Build Quality & Tools     │    15%    │ TypeScript, CI/CD, Neon, Groq, 11L  │
│ 5. Presentation              │    10%    │ 3-Min Script, Demo Flow & Slides    │
└──────────────────────────────┴───────────┴─────────────────────────────────────┘
```

---

## 1. Working Product (30% Weightage)

Vidyapath is not a mock concept or slide deck. It is a fully functional, dual-platform learning system:

### 📱 Live Deployed Artifacts
- **Official GitHub Release:** [Vidyapath v1.0.0 Release](https://github.com/yynvr1408/vidhyapath/releases/tag/v1.0.0)
- **Direct Android APK (Latest):** [📥 `vidyapath-app.apk` (4.07 MB)](https://github.com/yynvr1408/vidhyapath/releases/download/v1.0.0/vidyapath-app.apk)
- **Versioned Android APK:** [📥 `vidyapath-v1.0.0.apk` (4.07 MB)](https://github.com/yynvr1408/vidhyapath/releases/download/v1.0.0/vidyapath-v1.0.0.apk)
- **In-App Self-Updating:** Built-in auto-updater (`/api/app/check-update`) allows students to download new releases in 1 tap without requiring Google Play Store.

### 🌐 End-to-End Trilingual Engine
Complete curriculum, interface buttons, audio, worked solutions, and mistake remedies are available in three languages:
1. **🇮🇳 తెలుగు (Telugu):** Class 10 AP State Board Mathematics (`te-10-maths-ap.json`)
   - Chapter 1: వాస్తవ సంఖ్యలు (Real Numbers — Euclid's Lemma, HCF/LCM, Terminating Decimals, Irrational Proofs)
   - Chapter 2: సమితులు (Sets — Subsets, Union, Intersection, Set Difference, Venn Diagrams)
2. **🇮🇳 हिन्दी (Hindi):** Class 10 CBSE Board Mathematics (`hi-10-maths-cbse.json`)
   - वास्तविक संख्याएँ (Real Numbers) & बहुपद (Polynomials)
3. **🌐 English:** Class 10 CBSE Board Mathematics (`en-10-maths-cbse.json`)
   - Real Numbers & Polynomials

Students can select their language during profile onboarding or toggle instantly anywhere using the top header badge (`తెలుగు ⇄ हिन्दी ⇄ English`).

### ⚡ 100% Offline Capability (Zero-Data Mode)
- **Service Worker v2 Precaching:** Entire application shell (< 95 KB gzip) caches instantly on first load.
- **Offline Scoring & Formula Answers:** If connectivity drops to 0 bars, practice never halts. An on-device knowledge base (`findOfflineSyllabusAnswer`) instantly answers conceptual doubts from the syllabus without cloud calls.
- **Conflict-Free Sync Outbox:** Student attempts and offline doubts save to IndexedDB with client-generated UUIDs and flush seamlessly to Neon PostgreSQL when connectivity returns.

### 🧠 Adaptive Practice & Deterministic Answer Checker
- **Anti-Hallucination Mathematics:** AI **never grades student calculations**. Answer verification is deterministic with multiple accepted mathematical representations (`0 <= r < b`, `0 ≤ r < b`).
- **60/25/15 Question Selector:** Dynamically selects 60% weak skills, 25% review skills, and 15% new concepts.
- **3-Level Hint Ladder:** Nudge ➔ Conceptual Method ➔ Step-by-Step Worked Solution.

---

## 2. Business Viability (25% Weightage)

### 💰 Unit Economics: ₹18.50 ($0.22) / Learner / Month
Conventional ed-tech companies charge ₹5,000–₹30,000/year and burn heavy server costs on streaming video. Vidyapath achieves a **10x cost advantage**:

$$\text{Monthly Cost per Student} = \text{AI Inference (₹1.50)} + \text{Edge Cloud (₹2.00)} + \text{NGO Field Partner (₹15.00)} = \mathbf{₹18.50}$$

```
┌──────────────────────────────────────┬────────────────┬────────────────────────────────────────────────────────┐
│ Component                            │ Monthly Cost   │ Cost Efficiency Mechanism                              │
├──────────────────────────────────────┼────────────────┼────────────────────────────────────────────────────────┤
│ AI Inference (Groq + Offline)        │ ₹1.50          │ 78% of queries answered offline on-device at ₹0.00 cost│
│ Serverless Edge Hosting & Sync       │ ₹2.00          │ Ultra-lean payload (4.07 MB APK, < 95 KB PWA gzip)     │
│ Field NGO Operations & Amortized Pack│ ₹15.00         │ Scaled over 500+ student cohorts in state schools      │
├──────────────────────────────────────┼────────────────┼────────────────────────────────────────────────────────┤
│ Total Operating Cost / Active Student│ ₹18.50 / month │ Billed annually to CSR sponsors at ₹250 / year         │
└──────────────────────────────────────┴────────────────┴────────────────────────────────────────────────────────┘
```

### 🤝 Sustainable B2B2C Revenue Model
- **100% Free for Rural Learners:** No student or parent is ever charged for Class 1–10 foundational education.
- **Corporate CSR Grants (60%):** Fulfills mandatory 2% CSR compliance under the Indian Companies Act for corporate foundations (Reliance, Tata, Wipro, Infosys) requiring auditable learning outcomes.
- **State Education System Contracts (30%):** Licensing to Samagra Shiksha departments for board exam pass-rate interventions.
- **Institutional Subscriptions (10%):** Classes 11–12 and competitive entrance packs (JEE/NEET foundation) offered on an institutional subscription model.

### 📊 Live Sponsor Impact Dashboard (`/#impact`)
- Real-time cohort analytics tracking Active Learners, Session Completion Rates, and Average Mastery Growth.
- **Privacy Threshold:** Enforces strict minimum cohort size of $\ge 5$ students to prevent individual child identification.

---

## 3. Problem and User Clarity (20% Weightage)

### 👤 Built for "Priya": The Real Rural Persona
Priya is a 15-year-old Class 10 student in Chittoor district, Andhra Pradesh:
- **Shared Smartphone:** Uses her father's budget Android phone for 30 minutes in the evening after he returns from work. Two younger siblings share the same handset.
- **Intermittent Connectivity:** The family's 1.5 GB daily data pack exhausts by mid-day; home network fluctuates between 2G and offline.
- **Fear of Humiliation:** In traditional classrooms, students hesitate to ask doubts repeatedly for fear of being scolded.

### 🛠️ UX Solutions Tailored to Real Constraints
1. **Animal Avatar Multi-Profile Switcher:** No phone numbers, emails, or real names required. Children identify with colorful avatars (చిరుత / Cheetah, ఏనుగు / Elephant, etc.).
2. **2-Minute Shared-Phone Auto-Lock:** Optional 4-digit PBKDF2-hashed PIN locks prevent siblings from overwriting each other's practice progress.
3. **Mistake-Aware Coaching (No Red Screens):** Wrong options are mapped to specific misconception tags (e.g., `included_equal_to_b` or `forgot_remainder`), delivering compassionate local language remedies.
4. **Lighting the Village Metaphor:** Progress is visualized as village lanterns that glow brighter (0% to 100%) as skills are mastered.
5. **Guardian View (`/#guardian`):** View-only weekly progress card with zero login friction, showing accuracy % and a suggested offline family learning activity.

---

## 4. Build Quality and Use of Codebenders (15% Weightage)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                SYSTEM ARCHITECTURE OVERVIEW                              │
└──────────────────────────────────────────────────────────────────────────────────────────┘

  [ Learner Mobile Phone (Android APK / PWA) ]
      │
      ├── UI Layer: React 18 + TailwindCSS + Lucide Icons (Responsive down to 360px portrait)
      ├── Audio Engine: Dual Web Speech API + ElevenLabs Studio Voice Synthesis
      ├── Offline Engine: Service Worker v2 Cache + IndexedDB Append-Only Outbox
      └── Syllabus Unpacker: 1-Click dynamic content pack loader
      │
      ▼ (HTTPS JSON Payloads < 2 KB)
  [ Express 4 Backend & Edge Services (Render / Node.js 22) ]
      │
      ├── /api/tutor/ask    ──► Groq Cloud (openai/gpt-oss-120b · 120B LLM Tutor)
      ├── /api/tutor/voice  ──► Groq Whisper STT (whisper-large-v3-turbo)
      ├── /api/tutor/speak  ──► ElevenLabs Multilingual v2 (Natural Regional Speech)
      ├── /api/sync         ──► Neon Serverless PostgreSQL (Cloud Analytics & Doubts)
      ├── /api/app/update   ──► GitHub Releases REST API (Automated APK Distro)
      └── /api/admin/packs  ──► Pack Validation & Schema Engine
```

### 🔬 Modern Cloud & AI Integrations

#### 1. Groq Cloud Engine (High-Speed LLM & Whisper STT)
- **Model:** `openai/gpt-oss-120b` (120B parameter pedagogical reasoning model) running on Groq LPU inference.
- **Latency:** Generates concise 120-word Telugu/Hindi math explanations in **< 400ms**.
- **Voice Recognition:** `whisper-large-v3-turbo` translates spoken student voice queries into clean text for learners who find typing hard.

#### 2. ElevenLabs Multilingual Voice Synthesis
- **Model:** `eleven_multilingual_v2` with fine-tuned stability and regional pronunciation.
- **Pedagogical Empathy:** Speaks math explanations with natural, reassuring human intonation.
- **Zero-Data Fallback:** If network drops or no API key is supplied, automatically falls back to on-device Web Speech Synthesis without crashing.

#### 3. Neon Serverless PostgreSQL
- Cloud database with automatic connection pooling (`sslmode=require&channel_binding=require`) for syncing learner sessions, guardian digests, and sponsor cohort metrics.

#### 4. Automated GitHub Actions CI/CD Pipeline
- Custom workflow [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) automatically runs unit tests, compiles the PWA, syncs Capacitor, builds the Android APK with dynamic `versionCode`, and attaches downloadable `.apk` files to GitHub Releases.

---

## 5. Presentation & Demo Flow (10% Weightage)

### ⏱️ 3-Minute Live Demo Walkthrough
Follow our scripted walkthrough in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md):

1. **0:00 - 0:30 (The Shared Phone Reality):** Open `http://localhost:3000` (or Android APK). Show 1-tap switching between animal avatars (చిరుత / Cheetah) with PIN security.
2. **0:30 - 1:00 (Multilingual Audio Lesson):** Tap "Learn" ➔ Chapter 1 (Real Numbers). Tap the audio button to hear Euclid's Division Lemma explained aloud in clear Telugu/Hindi.
3. **1:00 - 1:40 (Adaptive Practice & Mistake Remedy):** Tap "Practice". Select distractor option A ($0 < r \le b$). Show the non-punitive mistake feedback explaining why remainder $r < b$. Tap hint ladder for a 3-step scaffold.
4. **1:40 - 2:10 (Simulated Zero Connectivity):** Toggle DevTools **Offline**. Practice Question 2 and ask an offline doubt. Notice the silent "Offline Mode — Progress Saved" banner and instant on-device formula reply.
5. **2:10 - 2:35 (Online Reconnection & Guardian View):** Toggle back to **Online**. Watch the green sync notification flash. Open Guardian View (`/#guardian`) to show the parent summary and home activity.
6. **2:35 - 3:00 (Sponsor Dashboard & Business Model):** Open `/#impact` to demonstrate live cohort KPIs and the ₹18.50 unit economics simulator.

---

## 6. Performance Budget & Verification Audit

```
┌───────────────────────────────────────┬───────────────────┬────────────────────┬──────────┐
│ Performance Metric                    │ Target Budget     │ Vidyapath Actual   │ Status   │
├───────────────────────────────────────┼───────────────────┼────────────────────┼──────────┤
│ Web PWA First Load (gzip bundle)      │ <= 150 KB         │ 93.7 KB            │ PASSED   │
│ Android APK Binary                    │ <= 100 MB         │ 4.07 MB            │ PASSED   │
│ Full Content Pack Payload (gzip)      │ <= 100 KB         │ 18.4 KB            │ PASSED   │
│ AI Response Payload (text)            │ <= 2 KB           │ < 0.8 KB (120 wds) │ PASSED   │
│ On-Device Doubt Response Latency      │ <= 100ms          │ < 12ms             │ PASSED   │
│ Comprehensive Test Suite              │ 100% Pass         │ 14/14 Suites Pass  │ PASSED   │
└───────────────────────────────────────┴───────────────────┴────────────────────┴──────────┘
```

---

## 7. Developer Quickstart & Local Setup

### Prerequisites
- Node.js `>= 22.0.0`
- npm `>= 10.0.0`
- Java 21 & Android SDK (optional, only needed for local Android builds — GitHub Actions builds APK automatically!)

### Installation
```bash
# Clone the repository
git clone https://github.com/yynvr1408/vidhyapath.git
cd vidhyapath

# Install dependencies
npm ci

# Run comprehensive test suite
npm test

# Launch development environment (Frontend on 3000, API Server on 3001)
npm run dev
npm run server
```

### Environment Configuration (`.env`)
Create a `.env` file in the root directory (refer to `.env.example`):
```env
PORT=3001
NODE_ENV=development

# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# AI Tutor & Speech
GROQ_API_KEY="gsk_your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-120b"
ELEVENLABS_API_KEY="your_elevenlabs_key"
ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM"

# GitHub Auto Releases
GITHUB_REPO_OWNER="yynvr1408"
GITHUB_REPO_NAME="vidhyapath"
GITHUB_RELEASE_REPO="yynvr1408/vidhyapath"
```

---

## 8. Repository Structure

```
├── .github/workflows/
│   ├── build-apk.yml           # Automated CI/CD: Tests, PWA build, Gradle APK, GitHub Release
│   └── ci.yml                  # PR verification workflow
├── android/                    # Capacitor Android Native project
│   ├── app/build.gradle        # Dynamic versionCode/versionName injection
│   └── gradle/wrapper/         # Gradle 8.13 wrapper
├── public/
│   ├── packs/                  # Swappable JSON Curriculum Packs
│   │   ├── te-10-maths-ap.json # Telugu Class 10 AP Board Mathematics
│   │   ├── hi-10-maths-cbse.json # Hindi Class 10 CBSE Board Mathematics
│   │   └── en-10-maths-cbse.json # English Class 10 CBSE Board Mathematics
│   └── sw.js                   # Service Worker v2 precaching & offline shell
├── server/
│   ├── services/
│   │   ├── groq.ts             # Groq LPU LLM & Whisper integration
│   │   ├── elevenlabs.ts       # ElevenLabs multilingual TTS synthesis
│   │   ├── neon.ts             # Neon Serverless PostgreSQL connector
│   │   └── r2.ts               # Cloudflare R2 object storage
│   └── index.ts                # Express API backend
├── src/
│   ├── components/             # Reusable UI widgets (Header, AppUpdateButton, etc.)
│   ├── screens/                # S1 to S12 Complete Screen Catalog
│   ├── services/               # Client storage, IndexedDB, tutor, & Web Speech
│   └── config/version.ts       # Version metadata synchronization
├── tests/
│   ├── system_test.ts          # Answer checker, adaptive formula, & validator unit tests
│   └── api_endpoints_test.ts   # Express API endpoint integration test suite
├── BUSINESS_SLIDE.md           # 1-Page Investor / CSR Pitch Slide
├── DEMO_SCRIPT.md              # 3-Minute Judge Demonstration Script
└── package.json                # Project dependencies & scripts
```

---

## 9. License

This project is open-source under the [MIT License](LICENSE). Built with pride for rural education equity at the ACE Builders Hackathon 2026.
