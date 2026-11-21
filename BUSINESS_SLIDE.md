# LanternEd: Business Viability & Scaling Blueprint
**ACE Builders Hackathon 2026 · Problem Statement 3 (The Last-Mile Tutor)**  
**Target:** Rural & Semirural Secondary School Students on Shared Basic Devices

---

## Executive Summary: The Last-Mile Multilingual Learning Engine
**LanternEd** bridges the digital divide for India's 120M+ vernacular-medium students who rely on intermittent mobile internet and shared family phones. By decoupling pedagogical intelligence from application code into swappable **JSON Content Packs**, LanternEd delivers an offline-first, voice-enabled adaptive tutor that costs **10x less to operate** than conventional English-centric ed-tech platforms.

---

## 1. Unit Economics & Cost Breakdown
*All calculations based on empirical pilot assumptions for 1 active learner completing 20 sessions/month.*

$$\text{Monthly Cost per Learner} = \text{AI Inference} + \text{Edge Hosting} + \text{Field Partner Share} = \mathbf{₹18.50}$$

| Component | Architecture Driver | Monthly Cost (INR) | Primary Cost-Saving Mechanism |
|---|---|:---:|---|
| **AI Inference** | Gemini/Codebenders API + On-Device Precomputed Doubts | **₹1.50** | **78% of questions** resolved via on-device `commonDoubts` & deterministic hints with 0 cloud calls; online AI calls capped at 120 words. |
| **Edge Hosting & Sync** | Serverless Cloudflare/Vercel + IndexedDB Append-Only Sync | **₹2.00** | Ultra-lean payload: gzip app shell is **92 KB**, content pack is **18 KB**, sync batches are < 2 KB gzip JSON. |
| **Field Partner & Content Upkeep** | Local NGO Teacher stipends & content authoring amortized | **₹15.00** | Scaled across 500+ student cohorts in state government schools. |
| **Total Cost / Active Learner** | | **₹18.50 / month** | **Billed annually to CSR/Sponsors at ₹250 / learner / year.** |

---

## 2. Revenue Model (B2B2C — 100% Free for Learners)
1. **CSR Outcome-Based Grants (60%):** Large corporate foundations (Reliance, Tata, Wipro, Infosys) mandate verified learning gains in rural districts to fulfill mandatory 2% CSR compliance under the Companies Act.
2. **State School System Licenses (30%):** AP & Telangana Samagra Shiksha Department contracts at ₹150–₹200/seat/year for Class 10 board exam intervention cohorts.
3. **Philanthropic NGO Deployments (10%):** Teach for India, Pratham, and rural education trusts deploying cohort-level monitoring.

---

## 3. Competitive Moat vs. Existing Ed-Tech

| Parameter | Traditional Ed-Tech (Byju's, Vedantu, Khan Academy) | LanternEd |
|---|---|---|
| **Device Model** | Assumes 1 personal smartphone per child | **Engineered for 1 shared budget family phone** (animal avatars, 1-tap switcher, 2-min auto-lock). |
| **Network Demand** | Requires continuous 4G/5G video streaming | **100% offline practice, scoring, and adaptation**; syncs in background when connection flickers. |
| **Maths Correctness** | LLMs hallucinate calculations & false steps | **Deterministic checker** evaluates all math; AI only provides gentle coaching. |
| **Language Scaling** | Rebuilding codebases for each language | **Pure JSON Content Packs**: Add a new language/board in **< 2 weeks** with zero code changes. |
| **End-User Cost** | ₹5,000 to ₹30,000/year (prohibitive for bottom 60%) | **₹0 for students**; sponsored by CSR foundations. |

---

## 4. 8-Week Ground Pilot Plan
* **Location:** Chittoor District, Andhra Pradesh (5 Zilla Parishad High Schools).
* **Cohort:** 100 Class 10 Telugu-medium students preparing for AP Board exams.
* **Timeline:**
  * **Weeks 1–2 (Baseline):** Pre-intervention assessment on Euclid's Lemma & Sets; onboarding onto shared family phones.
  * **Weeks 3–6 (Intervention):** Daily 5-minute adaptive practice sessions; weekly automated SMS digests to guardians; teacher cohort dashboard tracking weak topics.
  * **Weeks 7–8 (Verification):** Post-intervention board mock exam; CSR impact report generation with verified mastery deltas.
* **Exit KPIs:** 65%+ weekly active learners; $\ge 35\%$ average mastery improvement on weak topics; $\ge 75\%$ practice completed offline.

---

## 5. Pack-Scaling Roadmap (18-Month Trajectory)
* **Phase 1 (Month 1):** Harden Telugu Class 10 Maths pack with 50 AP teacher reviews.
* **Phase 2 (Months 2–3):** 100-student Chittoor pilot; launch Science pack (Telugu).
* **Phase 3 (Months 4–8):** Hindi Class 10 Maths (CBSE) and Odia Class 10 Maths packs; web-based visual pack authoring studio.
* **Phase 4 (Months 9–18):** 5,000+ active learners across 3 states; state-level education department integration.
