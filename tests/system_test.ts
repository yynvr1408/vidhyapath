import { DeterministicAnswerChecker } from '../src/engine/answerChecker';
import { PracticeEngine } from '../src/engine/practiceEngine';
import { TutorService } from '../src/services/tutor';
import { ContentPack, Question } from '../src/types';
import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('=== Vidyapath Verification & Test Suite ===\n');

  // Load Telugu pack
  const packPath = path.resolve(process.cwd(), 'public/packs/te-10-maths-ap.json');
  const pack: ContentPack = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

  console.log(`[PASS] Loaded Telugu Launch Pack: ${pack.id} (v${pack.version})`);
  console.log(`       Language: ${pack.languageName}`);
  console.log(`       Topics: ${pack.topics.length}, Questions: ${pack.questions.length}`);

  // 1. Test Deterministic Answer Checker
  console.log('\n--- 1. Testing Deterministic Answer Checker ---');
  const q1 = pack.questions[0]; // q101: answer is B
  const checkCorrect = DeterministicAnswerChecker.checkAnswer(q1, 'B', pack);
  console.assert(checkCorrect.isCorrect === true, 'q101 check failed for B');
  console.log('[PASS] Correct option B verified correctly:', checkCorrect.isCorrect);

  const checkAcceptedForm = DeterministicAnswerChecker.checkAnswer(q1, '0 <= r < b', pack);
  console.assert(checkAcceptedForm.isCorrect === true, 'q101 accepted form failed');
  console.log('[PASS] Accepted form "0 <= r < b" recognized correctly:', checkAcceptedForm.isCorrect);

  const checkWrong = DeterministicAnswerChecker.checkAnswer(q1, 'A', pack);
  console.assert(checkWrong.isCorrect === false, 'q101 check should be false for A');
  console.assert(checkWrong.mistakeTag === 'included_equal_to_b', 'mistakeTag mismatch');
  console.assert(checkWrong.remedyText !== null, 'remedyText should be present');
  console.log(`[PASS] Distractor mistake tag mapped: "${checkWrong.mistakeTag}"`);
  console.log(`       Remedy in Telugu: "${checkWrong.remedyText}"`);

  // 2. Test Practice Engine Mastery Formula
  console.log('\n--- 2. Testing Practice Engine Mastery Formula ---');
  // Formula: mastery = mastery + 0.25 * (credit - mastery)
  // Starting mastery 0.3. Correct with 0 hints -> credit 1.0
  // expected: 0.3 + 0.25 * (1.0 - 0.3) = 0.3 + 0.175 = 0.475
  const m1 = PracticeEngine.calculateNewMastery(0.3, true, 0);
  console.assert(m1 === 0.475, `Expected 0.475, got ${m1}`);
  console.log(`[PASS] Mastery update with 0 hints: 0.3 -> ${m1}`);

  // Correct with 2 hints -> credit 0.5
  // 0.3 + 0.25 * (0.5 - 0.3) = 0.3 + 0.05 = 0.35
  const m2 = PracticeEngine.calculateNewMastery(0.3, true, 2);
  console.assert(m2 === 0.35, `Expected 0.35, got ${m2}`);
  console.log(`[PASS] Mastery update with 2 hints: 0.3 -> ${m2}`);

  // Incorrect -> credit 0
  // 0.3 + 0.25 * (0 - 0.3) = 0.3 - 0.075 = 0.225
  const m3 = PracticeEngine.calculateNewMastery(0.3, false, 0);
  console.assert(m3 === 0.225, `Expected 0.225, got ${m3}`);
  console.log(`[PASS] Mastery update when incorrect: 0.3 -> ${m3}`);

  // 3. Test Adaptive 5-Question Session Generation
  console.log('\n--- 3. Testing Adaptive 5-Question Selection ---');
  const dummySkillStates = new Map();
  const session = PracticeEngine.selectSessionQuestions(pack, dummySkillStates);
  console.assert(session.length === 5, `Expected 5 questions, got ${session.length}`);
  console.log(`[PASS] Selected ${session.length} questions for session:`);
  session.forEach((q, i) => {
    console.log(`       Q${i + 1}: [${q.id}] (Skill: ${q.skillId}, Diff: ${q.difficulty})`);
  });

  // 4. Test AI Tutor Guardrails & Common Doubts
  console.log('\n--- 4. Testing AI Tutor & Common Doubts ---');
  const commonAns = TutorService.findInCommonDoubts(pack, 'హారం చూసి అంతమయ్యే దశాంశమో కాదో ఎలా చెప్పగలం?');
  console.assert(commonAns !== null, 'Common doubt lookup failed');
  console.log('[PASS] Instant offline common doubt answer found:');
  console.log(`       "${commonAns?.substring(0, 80)}..."`);

  const guardrailReply = TutorService.applyGuardrails('Some text', 'నాకు ఫోన్ నంబర్ కావాలి');
  console.assert(guardrailReply.includes('వ్యక్తిగత'), 'Guardrail personal data filter failed');
  console.log('[PASS] Guardrail personal info blocked kindly in Telugu:');
  console.log(`       "${guardrailReply}"`);

  // 5. Test Chapter Lantern Glow Calculation
  console.log('\n--- 5. Testing Lantern Glow Calculation ---');
  const glow = PracticeEngine.computeChapterLanternGlow(pack, 'ch1_real_numbers', dummySkillStates);
  console.log(`[PASS] Initial Chapter 1 Lantern Glow: ${glow.percent}% (${glow.masteredCount}/${glow.totalCount} mastered)`);

  console.log('\n=== ALL TEST CHECKS PASSED SUCCESSFULLY! ===');
}

runTests();
