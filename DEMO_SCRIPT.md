# LanternEd: 3-Minute Scripted Demonstration Guide
**ACE Builders Hackathon 2026 · Problem Statement 3 (The Last-Mile Tutor)**  
**Launch pack: Telugu · Class 10 · Mathematics (AP Board)**

---

### Timing Breakdown & Script

#### 0:00 - 0:25 · Name the Learner & The Shared-Phone Reality
* **Action:** Open `http://localhost:3000` on a simulated mobile view (360px portrait width).
* **Script:**
  > *"Meet Priya, a Class 10 student in rural Chittoor district, Andhra Pradesh. Her family shares a single budget Android phone with limited 1.5 GB daily data that often exhausts by afternoon. Existing ed-tech apps fail Priya: they assume English fluency, high-speed 4G, and a personal phone.  
  > This is **LanternEd: The Last-Mile Multilingual Learning Engine**.  
  > Watch the home screen: 'Who is learning?' (ఎవరు చదువుకుంటున్నారు?). Priya taps her animal avatar — the Cheetah (చిరుత). No real names, no phone numbers, and no passwords required. Her elder brother or sister can switch profiles in one single tap, with an automatic 2-minute safety lock protecting everyone's progress."*

---

#### 0:25 - 0:55 · Learn a Topic by Voice & Audio
* **Action:** Tap "Learn" (నేర్చుకో) -> Chapter 1: Real Numbers (వాస్తవ సంఖ్యలు) -> Step 1 Card. Tap the speaker button (వినండి).
* **Script:**
  > *"Every screen follows our core UX rule: one concept at a time, large touch targets, and every single sentence has on-device Telugu audio. When Priya taps the speaker icon, Euclid's Division Lemma ($a = bq + r$) is read aloud in clear, spoken Telugu. Notice that speech output runs on-device, consuming zero cellular data. Priya can step through cards with worked examples before diving into practice."*

---

#### 0:55 - 1:25 · Mistake-Aware Feedback & Deterministic Correctness
* **Action:** Tap "Practice" (సాధన చేయి). A 5-question session loads. Deliberately select Option A ($0 < r \le b$) on question 1.
* **Script:**
  > *"Let's see what happens when Priya makes a mistake. There are no humiliating red screens. Instead, our deterministic answer checker notices she selected option A, mapping it to the misconception tag `included_equal_to_b`.  
  > The app explains gently in Telugu: 'శేషం b కి సమానం కాకూడదు, కేవలం b కంటే తక్కువగా మాత్రమే (< b) ఉండాలి'.  
  > Crucially, **AI never decides whether math is correct**; deterministic stored keys do. This completely eliminates wrong-math hallucinations. Priya asks for a hint — our 3-step hint ladder nudges her thinking: Nudge -> Method -> Worked Step. Her skill mastery adapts in real-time."*

---

#### 1:25 - 1:50 · Network Drops to Zero: 100% Offline Practice & Queued Doubts
* **Action:** In Chrome DevTools, toggle **Offline** mode (or turn off Wi-Fi). Practice question 2. Then navigate to "Ask a Doubt" (సందేహం అడగండి) and type or select a question.
* **Script:**
  > *"Now Priya's father steps out into the fields, or daily data exhausts. Notice the silent top banner: 'ఇంటర్నెట్ లేదు (ఆఫ్‌లైన్ మోడ్) — ప్రోగ్రెస్ సురక్షితం'.  
  > The practice session never halts or freezes! All attempts write to local IndexedDB.  
  > Priya asks a doubt: 'హారం చూసి అంతమయ్యే దశాంశమో కాదో ఎలా చెప్పగలం?'. Our precomputed common doubts answer her instantly with zero data! For an uncached question, the system places it into an offline queue: 'క్యూలో ఉంది — నెట్‌వర్క్ రాగానే సమాధానం అందుతుంది'."*

---

#### 1:50 - 2:10 · Reconnect & Instant Conflict-Free Sync
* **Action:** Toggle DevTools back to **Online**.
* **Script:**
  > *"Priya reconnects to network. Instantly, our background outbox sync fires with client UUIDs. Look at the green banner: 'మీ ప్రోగ్రెస్ సేవ్ అయింది!' (Your progress is saved). The queued doubt is answered by the serverless AI tutor following our pack-templated prompt, capped at 120 words."*

---

#### 2:10 - 2:30 · The Guardian View (No Login Needed)
* **Action:** Tap the "Guardian View" link or open `/#guardian`.
* **Script:**
  > *"Priya's elder sibling or mother wants to know how she is doing without needing to navigate menus or create accounts. They open a read-only token link.  
  > The Guardian view shows this week's progress: 6 sessions completed, 82% accuracy, and highlights her weak skill: 'Difference of Sets ($A - B$)'.  
  > Most importantly, it gives the guardian an actionable prompt: 'Draw a Venn diagram on paper and play a sorting game together'. Ed-tech shouldn't isolate children; it should empower families."*

---

#### 2:30 - 2:50 · Sponsor Dashboard (/impact) & Unit Economics
* **Action:** Tap the heart icon or navigate to `/#impact`. Switch between KPIs and Unit Economics slider.
* **Script:**
  > *"Who pays for this? The students never pay. NGOs, CSR funds, and state education boards fund LanternEd on outcome-based milestones.  
  > On our `/impact` dashboard, sponsors see live cohort KPIs across 124 learners — privacy guaranteed with a minimum cohort threshold of 5.  
  > Our unit economics are revolutionary: by resolving 78%+ of queries and 100% of practice locally, **our monthly operating cost is just ₹18.50 per active learner** — 10x cheaper than standard LLM chatbots. We have mapped out an 8-week pilot across 100 learners in Chittoor district."*

---

#### 2:50 - 3:00 · The Winning Close
* **Script:**
  > *"Our honest commitment:  
  > **The launch pack is Telugu Class 10 Maths. Other languages and subjects are just new data packs running on the exact same engine.**  
  > Thank you!"*
