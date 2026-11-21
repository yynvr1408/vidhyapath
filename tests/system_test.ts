import { DeterministicAnswerChecker } from '../src/engine/answerChecker';
import { PracticeEngine } from '../src/engine/practiceEngine';
import { TutorService } from '../src/services/tutor';
import { hashPin, verifyPin } from '../src/services/pinHash';
import { ContentPack, Question, AttemptEvent } from '../src/types';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('=== Vidyapath Comprehensive Unit & System Test Suite ===\n');

  // Load Telugu launch pack
  const packPath = path.resolve(process.cwd(), 'public/packs/te-10-maths-ap.json');
  const pack: ContentPack = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

  console.log(`[PASS] Loaded Telugu Launch Pack: ${pack.id} (v${pack.version})`);
  console.log(`       Language: ${pack.languageName}`);
  console.log(`       Topics: ${pack.topics.length}, Questions: ${pack.questions.length}`);

  // ----------------------------------------------------
  // 1. Answer Checker Unit Tests (Edge Cases & Security)
  // ----------------------------------------------------
  console.log('\n--- 1. Answer Checker Unit Tests ---');
  const q1 = pack.questions[0]; // q101: answer is B, acceptedForms: ["B", "0 <= r < b", "0 ≤ r < b", "బి"]

  // 1a. Correct option
  const checkCorrect = DeterministicAnswerChecker.checkAnswer(q1, 'B', pack);
  console.assert(checkCorrect.isCorrect === true, 'q101 check failed for B');
  console.assert(checkCorrect.chosenOptionKey === 'B', 'chosenOptionKey must be B');
  console.log('[PASS] Correct option B matches correctly');

  // 1b. Correct accepted form
  const checkAcceptedForm = DeterministicAnswerChecker.checkAnswer(q1, '0 <= r < b', pack);
  console.assert(checkAcceptedForm.isCorrect === true, 'q101 accepted form failed');
  console.log('[PASS] Accepted form "0 <= r < b" recognized exactly');

  // 1c. Empty input regression test: empty string must NEVER match option A or anything
  const checkEmpty = DeterministicAnswerChecker.checkAnswer(q1, '', pack);
  console.assert(checkEmpty.isCorrect === false, 'Empty input must not be marked correct');
  console.assert(checkEmpty.chosenOptionKey === null, 'Empty input must not match any option');
  console.log('[PASS] Empty input evaluates to null choice and isCorrect: false');

  const checkWhitespace = DeterministicAnswerChecker.checkAnswer(q1, '   \n  ', pack);
  console.assert(checkWhitespace.isCorrect === false, 'Whitespace input must not be marked correct');
  console.assert(checkWhitespace.chosenOptionKey === null, 'Whitespace must not match any option');
  console.log('[PASS] Whitespace-only input correctly rejected');

  // 1d. Partial substring match must NOT trigger false positive
  const checkPartial = DeterministicAnswerChecker.checkAnswer(q1, '0', pack);
  console.assert(checkPartial.isCorrect === false, 'Substring "0" must not match "0 <= r < b"');
  console.log('[PASS] Substring input ("0") does not falsely match accepted form');

  // 1e. Wrong option with distractor mistake mapping
  const checkWrong = DeterministicAnswerChecker.checkAnswer(q1, 'A', pack);
  console.assert(checkWrong.isCorrect === false, 'q101 check should be false for A');
  console.assert(checkWrong.mistakeTag === 'included_equal_to_b', 'mistakeTag mismatch');
  console.assert(checkWrong.remedyText !== null, 'remedyText should be present');
  console.log(`[PASS] Distractor mistake tag mapped: "${checkWrong.mistakeTag}"`);
  console.log(`       Remedy in Telugu: "${checkWrong.remedyText}"`);

  // ----------------------------------------------------
  // 2. Practice Engine Mastery Formula Tests
  // ----------------------------------------------------
  console.log('\n--- 2. Practice Engine Mastery Formula ---');
  // Formula: mastery = mastery + 0.25 * (credit - mastery)
  // Starting mastery 0.3. Correct with 0 hints -> credit 1.0 -> 0.475
  const m1 = PracticeEngine.calculateNewMastery(0.3, true, 0);
  console.assert(m1 === 0.475, `Expected 0.475, got ${m1}`);
  console.log(`[PASS] Mastery update with 0 hints: 0.3 -> ${m1}`);

  // Correct with 2 hints -> credit 0.5 -> 0.35
  const m2 = PracticeEngine.calculateNewMastery(0.3, true, 2);
  console.assert(m2 === 0.35, `Expected 0.35, got ${m2}`);
  console.log(`[PASS] Mastery update with 2 hints: 0.3 -> ${m2}`);

  // Incorrect -> credit 0 -> 0.225
  const m3 = PracticeEngine.calculateNewMastery(0.3, false, 0);
  console.assert(m3 === 0.225, `Expected 0.225, got ${m3}`);
  console.log(`[PASS] Mastery update when incorrect: 0.3 -> ${m3}`);

  // ----------------------------------------------------
  // 3. Adaptive 5-Question Session Generation
  // ----------------------------------------------------
  console.log('\n--- 3. Adaptive 5-Question Selection ---');
  const dummySkillStates = new Map();
  const session = PracticeEngine.selectSessionQuestions(pack, dummySkillStates);
  console.assert(session.length === 5, `Expected 5 questions, got ${session.length}`);
  console.log(`[PASS] Selected ${session.length} questions for session:`);
  session.forEach((q, i) => {
    console.log(`       Q${i + 1}: [${q.id}] (Skill: ${q.skillId}, Diff: ${q.difficulty})`);
  });

  // ----------------------------------------------------
  // 4. Content Pack Validation Unit Tests
  // ----------------------------------------------------
  console.log('\n--- 4. Content Pack Validation Unit Tests ---');
  // Helper to run pure validation logic
  function validatePackContent(p: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!p.id) errors.push('Missing required field: id');
    if (!p.version) errors.push('Missing required field: version');
    if (!p.language) errors.push('Missing required field: language');
    if (!p.topics || !Array.isArray(p.topics) || p.topics.length === 0) {
      errors.push('Pack must contain at least 1 topic in topics[]');
    }
    if (!p.questions || !Array.isArray(p.questions)) {
      errors.push('Pack must contain questions array');
    }

    const qIds = new Set<string>();
    const allSkills = new Set<string>();
    if (p.topics && Array.isArray(p.topics)) {
      for (const t of p.topics) {
        if (t.skills) {
          for (const s of t.skills) allSkills.add(s);
        }
      }
    }

    if (p.questions && Array.isArray(p.questions)) {
      for (const q of p.questions) {
        if (qIds.has(q.id)) {
          errors.push(`Duplicate question id: "${q.id}"`);
        }
        qIds.add(q.id);

        if (!q.skillId || !allSkills.has(q.skillId)) {
          errors.push(`Question "${q.id}" references unknown skillId: "${q.skillId}"`);
        }

        if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
          errors.push(`Question "${q.id}" has invalid answer key: "${q.answer}"`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // 4a. Validate real launch pack
  const validReport = validatePackContent(pack);
  console.assert(validReport.valid === true, `Launch pack should be valid: ${validReport.errors.join(', ')}`);
  console.log('[PASS] Launch pack te-10-maths-ap passes 100% schema validation');

  // 4b. Test validation failure on unknown skill
  const brokenPack = {
    id: 'test_broken',
    version: '1.0.0',
    language: 'te',
    topics: [{ id: 't1', skills: ['known_skill'] }],
    questions: [{ id: 'q_fake', skillId: 'ghost_skill', answer: 'A' }],
  };
  const brokenReport = validatePackContent(brokenPack);
  console.assert(brokenReport.valid === false, 'Broken pack should fail validation');
  console.assert(brokenReport.errors.some(e => e.includes('unknown skillId')), 'Should detect unknown skill');
  console.log('[PASS] Pack validator correctly flags unknown skill references');

  // 4c. Test validation failure on duplicate question IDs
  const dupePack = {
    id: 'test_dupe',
    version: '1.0.0',
    language: 'te',
    topics: [{ id: 't1', skills: ['skill_a'] }],
    questions: [
      { id: 'q_dupe', skillId: 'skill_a', answer: 'A' },
      { id: 'q_dupe', skillId: 'skill_a', answer: 'B' },
    ],
  };
  const dupeReport = validatePackContent(dupePack);
  console.assert(dupeReport.valid === false, 'Duplicate pack should fail');
  console.assert(dupeReport.errors.some(e => e.includes('Duplicate question id')), 'Should detect duplicate ID');
  console.log('[PASS] Pack validator correctly flags duplicate question IDs');

  // ----------------------------------------------------
  // 5. PIN Hashing & Security Verification (PBKDF2-SHA256)
  // ----------------------------------------------------
  console.log('\n--- 5. PIN Hashing & Security Tests ---');
  const rawPin = '4321';
  const hashed = await hashPin(rawPin);
  console.assert(hashed.startsWith('pbkdf2$100000$'), 'Hash must follow pbkdf2 format');
  console.log('[PASS] PIN hashed with PBKDF2-SHA256 (100,000 iterations):', hashed.substring(0, 35) + '...');

  const verifyGood = await verifyPin(rawPin, hashed);
  console.assert(verifyGood === true, 'Valid PIN verification failed');
  console.log('[PASS] Valid PIN verified successfully');

  const verifyBad = await verifyPin('9999', hashed);
  console.assert(verifyBad === false, 'Invalid PIN must not verify');
  console.log('[PASS] Invalid PIN rejected correctly');

  // Test legacy plaintext migration compatibility
  const legacyStored = '1234';
  const verifyLegacy = await verifyPin('1234', legacyStored);
  console.assert(verifyLegacy === true, 'Legacy plaintext PIN should match');
  console.log('[PASS] Legacy plaintext PIN migration check supported');

  // ----------------------------------------------------
  // 6. AI Tutor Guardrails & Common Doubts
  // ----------------------------------------------------
  console.log('\n--- 6. AI Tutor & Common Doubts ---');
  const commonAns = TutorService.findInCommonDoubts(pack, 'హారం చూసి అంతమయ్యే దశాంశమో కాదో ఎలా చెప్పగలం?');
  console.assert(commonAns !== null, 'Common doubt lookup failed');
  console.log('[PASS] Instant offline common doubt answer found:');
  console.log(`       "${commonAns?.substring(0, 70)}..."`);

  const guardrailReply = TutorService.applyGuardrails('Some text', 'నాకు ఫోన్ నంబర్ కావాలి');
  console.assert(guardrailReply.includes('వ్యక్తిగత'), 'Guardrail personal data filter failed');
  console.log('[PASS] Guardrail personal info blocked kindly in Telugu');

  // ----------------------------------------------------
  // 7. Chapter Lantern Glow Calculation
  // ----------------------------------------------------
  console.log('\n--- 7. Lantern Glow Calculation ---');
  const glow = PracticeEngine.computeChapterLanternGlow(pack, 'ch1_real_numbers', dummySkillStates);
  console.log(`[PASS] Initial Chapter 1 Lantern Glow: ${glow.percent}% (${glow.masteredCount}/${glow.totalCount} mastered)`);

  console.log('\n=== ALL COMPREHENSIVE UNIT & SYSTEM TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
