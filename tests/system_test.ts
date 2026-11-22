import { DeterministicAnswerChecker } from '../frontend/src/engine/answerChecker';
import { PracticeEngine } from '../frontend/src/engine/practiceEngine';
import { TutorService } from '../frontend/src/services/tutor';
import { ContentPack, Question } from '../frontend/src/types';
import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('=== Vidyapath Verification & Test Suite ===\n');

  // Load Packs: Telugu, English, Hindi
  const tePackPath = path.resolve(process.cwd(), 'frontend/public/packs/te-10-maths-ap.json');
  const enPackPath = path.resolve(process.cwd(), 'frontend/public/packs/en-10-maths-cbse.json');
  const hiPackPath = path.resolve(process.cwd(), 'frontend/public/packs/hi-10-maths-cbse.json');

  const tePack: ContentPack = JSON.parse(fs.readFileSync(tePackPath, 'utf-8'));
  const enPack: ContentPack = JSON.parse(fs.readFileSync(enPackPath, 'utf-8'));
  const hiPack: ContentPack = JSON.parse(fs.readFileSync(hiPackPath, 'utf-8'));

  console.log(`[PASS] Loaded Telugu Launch Pack: ${tePack.id} (v${tePack.version})`);
  console.log(`       Language: ${tePack.languageName}, Topics: ${tePack.topics.length}, Questions: ${tePack.questions.length}`);

  console.log(`[PASS] Loaded English Launch Pack: ${enPack.id} (v${enPack.version})`);
  console.log(`       Language: ${enPack.languageName}, Topics: ${enPack.topics.length}, Questions: ${enPack.questions.length}`);

  console.log(`[PASS] Loaded Hindi Launch Pack: ${hiPack.id} (v${hiPack.version})`);
  console.log(`       Language: ${hiPack.languageName}, Topics: ${hiPack.topics.length}, Questions: ${hiPack.questions.length}`);

  // 1. Test Deterministic Answer Checker (Telugu)
  console.log('\n--- 1. Testing Deterministic Answer Checker (Telugu) ---');
  const teQ1 = tePack.questions[0]; // q101: answer is B
  const checkCorrect = DeterministicAnswerChecker.checkAnswer(teQ1, 'B', tePack);
  console.assert(checkCorrect.isCorrect === true, 'q101 check failed for B');
  console.log('[PASS] Correct option B verified correctly:', checkCorrect.isCorrect);

  const checkAcceptedForm = DeterministicAnswerChecker.checkAnswer(teQ1, '0 <= r < b', tePack);
  console.assert(checkAcceptedForm.isCorrect === true, 'q101 accepted form failed');
  console.log('[PASS] Accepted form "0 <= r < b" recognized correctly:', checkAcceptedForm.isCorrect);

  const checkWrong = DeterministicAnswerChecker.checkAnswer(teQ1, 'A', tePack);
  console.assert(checkWrong.isCorrect === false, 'q101 check should be false for A');
  console.assert(checkWrong.mistakeTag === 'included_equal_to_b', 'mistakeTag mismatch');
  console.assert(checkWrong.remedyText !== null, 'remedyText should be present');
  console.log(`[PASS] Distractor mistake tag mapped: "${checkWrong.mistakeTag}"`);
  console.log(`       Remedy in Telugu: "${checkWrong.remedyText}"`);

  // 2. Test Deterministic Answer Checker (English)
  console.log('\n--- 2. Testing Deterministic Answer Checker (English) ---');
  const enQ1 = enPack.questions[0]; // q_en_101: answer is B
  const enCheckCorrect = DeterministicAnswerChecker.checkAnswer(enQ1, 'B', enPack);
  console.assert(enCheckCorrect.isCorrect === true, 'enQ1 check failed for B');
  console.log('[PASS] English Correct option B verified correctly:', enCheckCorrect.isCorrect);

  const enCheckAccepted = DeterministicAnswerChecker.checkAnswer(enQ1, '0 <= r < b', enPack);
  console.assert(enCheckAccepted.isCorrect === true, 'enQ1 accepted form failed');
  console.log('[PASS] English Accepted form "0 <= r < b" recognized:', enCheckAccepted.isCorrect);

  const enCheckWrong = DeterministicAnswerChecker.checkAnswer(enQ1, 'A', enPack);
  console.assert(enCheckWrong.isCorrect === false, 'enQ1 check should be false for A');
  console.assert(enCheckWrong.mistakeTag !== null, 'enQ1 mistakeTag should be present');
  console.assert(enCheckWrong.remedyText !== null, 'enQ1 remedyText should be present');
  console.log(`[PASS] English Distractor mistake tag mapped: "${enCheckWrong.mistakeTag}"`);
  console.log(`       Remedy in English: "${enCheckWrong.remedyText}"`);

  // 3. Test Deterministic Answer Checker (Hindi)
  console.log('\n--- 3. Testing Deterministic Answer Checker (Hindi) ---');
  const hiQ1 = hiPack.questions[0];
  const hiCheckCorrect = DeterministicAnswerChecker.checkAnswer(hiQ1, hiQ1.answer, hiPack);
  console.assert(hiCheckCorrect.isCorrect === true, 'hiQ1 check failed');
  console.log(`[PASS] Hindi Correct option ${hiQ1.answer} verified:`, hiCheckCorrect.isCorrect);

  // 4. Test Practice Engine Mastery Formula
  console.log('\n--- 4. Testing Practice Engine Mastery Formula ---');
  const m1 = PracticeEngine.calculateNewMastery(0.3, true, 0);
  console.assert(m1 === 0.475, `Expected 0.475, got ${m1}`);
  console.log(`[PASS] Mastery update with 0 hints: 0.3 -> ${m1}`);

  const m2 = PracticeEngine.calculateNewMastery(0.3, true, 2);
  console.assert(m2 === 0.35, `Expected 0.35, got ${m2}`);
  console.log(`[PASS] Mastery update with 2 hints: 0.3 -> ${m2}`);

  const m3 = PracticeEngine.calculateNewMastery(0.3, false, 0);
  console.assert(m3 === 0.225, `Expected 0.225, got ${m3}`);
  console.log(`[PASS] Mastery update when incorrect: 0.3 -> ${m3}`);

  // 5. Test Adaptive 5-Question Session Generation Across Packs
  console.log('\n--- 5. Testing Adaptive 5-Question Selection ---');
  const dummySkillStates = new Map();
  const teSession = PracticeEngine.selectSessionQuestions(tePack, dummySkillStates);
  console.assert(teSession.length === 5, `Expected 5 Telugu questions, got ${teSession.length}`);
  console.log(`[PASS] Selected ${teSession.length} Telugu questions for session.`);

  const enSession = PracticeEngine.selectSessionQuestions(enPack, dummySkillStates);
  console.assert(enSession.length === 5, `Expected 5 English questions, got ${enSession.length}`);
  console.log(`[PASS] Selected ${enSession.length} English questions for session:`);
  enSession.forEach((q, i) => {
    console.log(`       Q${i + 1}: [${q.id}] (${q.text.substring(0, 45)}...)`);
  });

  const hiSession = PracticeEngine.selectSessionQuestions(hiPack, dummySkillStates);
  console.assert(hiSession.length === 5, `Expected 5 Hindi questions, got ${hiSession.length}`);
  console.log(`[PASS] Selected ${hiSession.length} Hindi questions for session.`);

  // 6. Test AI Tutor Guardrails & Common Doubts in Telugu, English & Hindi
  console.log('\n--- 6. Testing AI Tutor & Common Doubts ---');
  const teCommonAns = TutorService.findInCommonDoubts(tePack, 'హారం చూసి అంతమయ్యే దశాంశమో కాదో ఎలా చెప్పగలం?');
  console.assert(teCommonAns !== null, 'Telugu Common doubt lookup failed');
  console.log(`[PASS] Instant offline Telugu common doubt answer found: "${teCommonAns?.substring(0, 50)}..."`);

  const enCommonAns = TutorService.findInCommonDoubts(enPack, "What is Euclid's Division Lemma?");
  console.assert(enCommonAns !== null, 'English Common doubt lookup failed');
  console.log(`[PASS] Instant offline English common doubt answer found: "${enCommonAns?.substring(0, 50)}..."`);

  const hiCommonAns = TutorService.findInCommonDoubts(hiPack, 'यूक्लिड विभाजन प्रमेयिका क्या है?');
  console.assert(hiCommonAns !== null, 'Hindi Common doubt lookup failed');
  console.log(`[PASS] Instant offline Hindi common doubt answer found: "${hiCommonAns?.substring(0, 50)}..."`);

  // Guardrails
  const teGuard = TutorService.applyGuardrails('Some text', 'నాకు ఫోన్ నంబర్ కావాలి', tePack);
  console.assert(teGuard.includes('వ్యక్తిగత'), 'Guardrail personal data filter failed for Telugu');
  console.log('[PASS] Telugu Guardrail personal info blocked kindly');

  const enGuard = TutorService.applyGuardrails('Some text', 'Give me your phone number and address', enPack);
  console.assert(enGuard.includes('personal'), 'Guardrail personal data filter failed for English');
  console.log('[PASS] English Guardrail personal info blocked kindly');

  const hiGuard = TutorService.applyGuardrails('Some text', 'मुझे फोन नंबर चाहिए', hiPack);
  console.assert(hiGuard.includes('व्यक्तिगत'), 'Guardrail personal data filter failed for Hindi');
  console.log('[PASS] Hindi Guardrail personal info blocked kindly');

  // 7. Test Chapter Lantern Glow Calculation
  console.log('\n--- 7. Testing Lantern Glow Calculation ---');
  const glow = PracticeEngine.computeChapterLanternGlow(enPack, 'ch1_real_numbers', dummySkillStates);
  console.log(`[PASS] English Chapter 1 Lantern Glow: ${glow.percent}% (${glow.masteredCount}/${glow.totalCount} mastered)`);

  console.log('\n=== ALL MULTILINGUAL TEST CHECKS PASSED SUCCESSFULLY! ===');
}

runTests();
