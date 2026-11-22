import { ContentPack, Question, SkillState, AttemptEvent } from '../types';
import { localDb } from '../db/indexedDb';

export class PracticeEngine {
  /**
   * Calculates the updated mastery for a skill based on student's performance.
   * mastery = mastery + 0.25 * (credit - mastery)
   */
  public static calculateNewMastery(
    currentMastery: number,
    correct: boolean,
    hintsUsed: number
  ): number {
    let credit = 0;
    if (correct) {
      if (hintsUsed === 0) credit = 1.0;
      else if (hintsUsed === 1) credit = 0.75;
      else if (hintsUsed === 2) credit = 0.50;
      else credit = 0.25;
    }

    const updated = currentMastery + 0.25 * (credit - currentMastery);
    return Math.max(0.05, Math.min(1.0, Math.round(updated * 1000) / 1000));
  }

  /**
   * Checks if a skill is fully mastered:
   * mastery >= 0.8 and at least 3 consecutive correct with <= 1 hint
   */
  public static isSkillMastered(state?: SkillState | null): boolean {
    if (!state) return false;
    return state.mastery >= 0.8 && state.consecutiveCorrectLowHints >= 3;
  }

  /**
   * Computes chapter lantern glow percentage (0% to 100%)
   * based on the proportion of mastered skills in that chapter.
   */
  public static computeChapterLanternGlow(
    pack: ContentPack,
    topicId: string,
    skillStates: Map<string, SkillState>
  ): { percent: number; masteredCount: number; totalCount: number } {
    const topic = pack.topics.find((t) => t.id === topicId);
    if (!topic || topic.skills.length === 0) return { percent: 0, masteredCount: 0, totalCount: 0 };

    let masteredCount = 0;
    for (const skillId of topic.skills) {
      const state = skillStates.get(skillId);
      if (this.isSkillMastered(state)) {
        masteredCount++;
      }
    }

    const percent = Math.round((masteredCount / topic.skills.length) * 100);
    return { percent, masteredCount, totalCount: topic.skills.length };
  }

  /**
   * Selects an adaptive sequence of 5 questions for a session:
   * 60% from weakest skills, 25% review, 15% new/stretch.
   */
  public static selectSessionQuestions(
    pack: ContentPack,
    skillStates: Map<string, SkillState>,
    targetTopicId?: string
  ): Question[] {
    // Filter questions by target topic if specified
    let candidatePool = pack.questions;
    if (targetTopicId) {
      const topic = pack.topics.find((t) => t.id === targetTopicId);
      if (topic) {
        candidatePool = candidatePool.filter((q) => topic.skills.includes(q.skillId));
      }
    }

    if (candidatePool.length <= 5) {
      return [...candidatePool];
    }

    // Categorize skills into Weakest, Review, and Stretch
    const scoredSkills = candidatePool.map((q) => {
      const state = skillStates.get(q.skillId);
      const mastery = state ? state.mastery : 0.3; // initial default
      const lastSeen = state ? state.lastSeen : 0;
      return { question: q, mastery, lastSeen };
    });

    // Helper to pick questions matching appropriate difficulty tier
    const getTargetDifficulty = (mastery: number): 1 | 2 | 3 => {
      if (mastery < 0.4) return 1;
      if (mastery <= 0.7) return 2;
      return 3;
    };

    const selected: Question[] = [];
    const usedQuestionIds = new Set<string>();

    const pickOne = (filtered: typeof scoredSkills) => {
      const available = filtered.filter((item) => !usedQuestionIds.has(item.question.id));
      if (available.length === 0) return null;
      // Pick random among top candidates
      const chosen = available[Math.floor(Math.random() * available.length)];
      usedQuestionIds.add(chosen.question.id);
      return chosen.question;
    };

    // 1. Weakest skills (up to 3 questions = 60%)
    const weakSorted = [...scoredSkills].sort((a, b) => a.mastery - b.mastery);
    for (let i = 0; i < 3; i++) {
      const q = pickOne(weakSorted);
      if (q) selected.push(q);
    }

    // 2. Review skills (older lastSeen) (1 question = 20-25%)
    const reviewSorted = [...scoredSkills].sort((a, b) => a.lastSeen - b.lastSeen);
    const reviewQ = pickOne(reviewSorted);
    if (reviewQ) selected.push(reviewQ);

    // 3. New / Stretch question (higher difficulty) (1 question = 15-20%)
    const stretchPool = scoredSkills.filter((item) => {
      const targetDiff = getTargetDifficulty(item.mastery);
      return item.question.difficulty >= targetDiff;
    });
    const stretchQ = pickOne(stretchPool.length > 0 ? stretchPool : scoredSkills);
    if (stretchQ) selected.push(stretchQ);

    // Fill to 5 if needed
    while (selected.length < 5 && usedQuestionIds.size < candidatePool.length) {
      const remaining = candidatePool.filter((q) => !usedQuestionIds.has(q.id));
      if (remaining.length === 0) break;
      const q = remaining[0];
      usedQuestionIds.add(q.id);
      selected.push(q);
    }

    return selected;
  }

  /**
   * Persists an attempt and updates the skill state locally in IndexedDB.
   */
  public static async recordAttemptAndUpdateSkill(
    event: AttemptEvent
  ): Promise<SkillState> {
    // Persist the attempt, outbox row, and derived mastery together so a failed
    // IndexedDB write cannot leave half of one learner's progress behind.
    return localDb.recordAttemptWithSkillUpdate(event, (savedState) => {
      const state = savedState || {
        learnerId: event.learnerId,
        skillId: event.skillId,
        mastery: 0.3,
        streak: 0,
        consecutiveCorrectLowHints: 0,
        lastSeen: event.ts,
      };

      const newMastery = this.calculateNewMastery(state.mastery, event.correct, event.hintsUsed);
      let newStreak = state.streak;
      let newConsecutive = state.consecutiveCorrectLowHints;

      if (event.correct) {
        newStreak++;
        if (event.hintsUsed <= 1) {
          newConsecutive++;
        } else {
          newConsecutive = 0;
        }
      } else {
        newStreak = 0;
        newConsecutive = 0;
      }

      return {
        ...state,
        mastery: newMastery,
        streak: newStreak,
        consecutiveCorrectLowHints: newConsecutive,
        lastSeen: event.ts,
      };
    });
  }
}
