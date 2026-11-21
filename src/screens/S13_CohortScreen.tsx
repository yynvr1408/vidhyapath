import React, { useState } from 'react';
import { ArrowLeft, Users, Search, Lock, BarChart3, Target, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localDb } from '../db/indexedDb';
import { ContentPack, LearnerProfile, SkillState } from '../types';

// Minimum number of learners a cohort needs before ANY statistic is shown.
const MIN_COHORT_SIZE = 5;

// Telugu strings. Each one needs native review before release.
const T = {
  title: 'ఉపాధ్యాయ వీక్షణ (Teacher View)', // TODO native review
  codeLabel: 'కోహోర్ట్ కోడ్ (Cohort code):', // TODO native review
  codePlaceholder: 'ఉదా: VIDYA-01', // TODO native review
  viewButton: 'చూడండి (View)', // TODO native review
  loading: 'లోడ్ అవుతోంది...', // TODO native review
  emptyTitle: 'ఈ కోడ్‌తో విద్యార్థులు లేరు', // TODO native review
  emptyBody: 'కోడ్‌ను సరిచూసి మళ్ళీ ప్రయత్నించండి.', // TODO native review
  hiddenTitle: 'గోప్యత కోసం ఈ నివేదిక దాచబడింది', // TODO native review
  hiddenBody: 'విద్యార్థుల గోప్యతను కాపాడటానికి, కనీసం 5 మంది విద్యార్థులు ఉన్నప్పుడు మాత్రమే నివేదిక చూపబడుతుంది.', // TODO native review
  activeLearners: 'చురుకైన విద్యార్థులు (Active learners)', // TODO native review
  chapterMastery: 'అధ్యాయాల వారీ సగటు నైపుణ్యం (Average mastery per chapter)', // TODO native review
  weakSkills: 'అతి బలహీన నైపుణ్యాలు (Weakest skills)', // TODO native review
  noData: 'డేటా లేదు (No data yet)', // TODO native review
  loadError: 'డేటా చదవడం సాధ్యం కాలేదు. మళ్ళీ ప్రయత్నించండి.', // TODO native review
  back: 'వెనక్కి (Back)', // TODO native review
};

interface ChapterStat {
  topicId: string;
  title: string;
  titleEn?: string;
  avgMastery: number | null;
}

interface WeakSkillStat {
  skillId: string;
  labelTe: string;
  labelEn: string;
  avgMastery: number;
}

interface CohortReport {
  learnerCount: number;
  chapters: ChapterStat[];
  weakSkills: WeakSkillStat[];
}

/**
 * Privacy gate. Returns true when the cohort has fewer than MIN_COHORT_SIZE learners.
 * When true, the screen shows only the hidden-report message: no count, no averages,
 * no skill rankings. buildCohortReport also returns early on this check so no
 * statistics are computed for small cohorts.
 */
export function isCohortReportHidden(learnerCount: number): boolean {
  return learnerCount < MIN_COHORT_SIZE;
}

const percent = (mastery: number): string => `${Math.round(mastery * 100)}%`;

// Builds the cohort report from local IndexedDB data only. No names, phones or other personal data are returned.
async function buildCohortReport(cohortKey: string, pack: ContentPack | null): Promise<CohortReport> {
  const all: LearnerProfile[] = await localDb.getLearners();
  const members = all.filter((l) => (l.cohortCode || '').trim().toLowerCase() === cohortKey);
  const learnerCount = members.length;

  // Privacy gate first: empty or too-small cohorts compute nothing.
  if (learnerCount === 0 || isCohortReportHidden(learnerCount)) {
    return { learnerCount, chapters: [], weakSkills: [] };
  }

  // Sum and count of mastery per skill across all cohort members.
  const perSkill = new Map<string, { sum: number; n: number }>();
  for (const learner of members) {
    const states: SkillState[] = await localDb.getAllSkillStates(learner.id);
    for (const s of states) {
      const acc = perSkill.get(s.skillId) || { sum: 0, n: 0 };
      acc.sum += s.mastery;
      acc.n += 1;
      perSkill.set(s.skillId, acc);
    }
  }

  const topics = pack?.topics || [];

  // Average mastery per chapter (topic), over every cohort skill state in that chapter.
  const chapters: ChapterStat[] = topics.map((t) => {
    let sum = 0;
    let n = 0;
    for (const sid of t.skills) {
      const acc = perSkill.get(sid);
      if (acc) {
        sum += acc.sum;
        n += acc.n;
      }
    }
    return {
      topicId: t.id,
      title: t.title,
      titleEn: t.titleEn,
      avgMastery: n > 0 ? sum / n : null,
    };
  });

  // Top 3 weakest skills across the cohort (lowest average mastery first).
  const weakSkills: WeakSkillStat[] = Array.from(perSkill.entries())
    .map(([skillId, acc]) => {
      const topic = topics.find((t) => t.skills.includes(skillId));
      return {
        skillId,
        // The pack has no per-skill Telugu name yet, so fall back to the chapter title.
        labelTe: pack?.uiStrings?.[`skill_${skillId}`] || topic?.title || skillId, // TODO native review
        labelEn: skillId.replace(/_/g, ' '),
        avgMastery: acc.sum / acc.n,
      };
    })
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 3);

  return { learnerCount, chapters, weakSkills };
}

export const S13_CohortScreen: React.FC = () => {
  const { pack, activeLearner, setScreen } = useApp();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [report, setReport] = useState<CohortReport | null>(null);

  const handleView = async () => {
    const key = code.trim().toLowerCase();
    if (!key) return;
    setStatus('loading');
    try {
      const r = await buildCohortReport(key, pack);
      setReport(r);
      setStatus('done');
    } catch {
      setReport(null);
      setStatus('error');
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E5E7EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  };

  const headingStyle: React.CSSProperties = {
    color: '#2B2D6E',
    fontSize: 18,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  };

  const bodyStyle: React.CSSProperties = { color: '#1F2937', fontSize: 18, lineHeight: 1.5 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8E7', display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>
      <header style={{ backgroundColor: '#2B2D6E', color: '#FFFFFF', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 448, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
            aria-label={T.back}
            style={{ minWidth: 56, minHeight: 56, borderRadius: 16, backgroundColor: '#1E1F4D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700 }}>
            <Users style={{ width: 24, height: 24 }} />
            <span>{T.title}</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 448, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* Cohort code input: the only input on this screen */}
        <div style={cardStyle}>
          <label htmlFor="cohort-code" style={{ ...headingStyle, marginBottom: 8 }}>
            <Search style={{ width: 24, height: 24 }} />
            <span>{T.codeLabel}</span>
          </label>
          <input
            id="cohort-code"
            type="text"
            value={code}
            placeholder={T.codePlaceholder}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            style={{ width: '100%', minHeight: 56, boxSizing: 'border-box', borderRadius: 16, border: '2px solid #2B2D6E', padding: '0 14px', fontSize: 18, backgroundColor: '#FFFFFF', color: '#1F2937', marginBottom: 12 }}
          />
          <button
            type="button"
            onClick={handleView}
            style={{ width: '100%', minHeight: 56, borderRadius: 16, backgroundColor: '#2B2D6E', color: '#FFFFFF', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <BarChart3 style={{ width: 24, height: 24 }} />
            <span>{T.viewButton}</span>
          </button>
        </div>

        {status === 'loading' && <div style={{ ...bodyStyle, textAlign: 'center' }}>{T.loading}</div>}

        {status === 'error' && (
          <div style={{ ...cardStyle, borderColor: '#D9534F', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle style={{ width: 24, height: 24, color: '#D9534F', flexShrink: 0 }} />
            <p style={{ ...bodyStyle, margin: 0, color: '#D9534F' }}>{T.loadError}</p>
          </div>
        )}

        {status === 'done' && report && report.learnerCount === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <Users style={{ width: 40, height: 40, color: '#2B2D6E', margin: '0 auto 8px' }} />
            <p style={{ ...headingStyle, justifyContent: 'center', marginBottom: 4 }}>{T.emptyTitle}</p>
            <p style={{ ...bodyStyle, margin: 0 }}>{T.emptyBody}</p>
          </div>
        )}

        {status === 'done' && report && report.learnerCount > 0 && isCohortReportHidden(report.learnerCount) && (
          <div style={cardStyle}>
            <h2 style={headingStyle}>
              <Lock style={{ width: 24, height: 24 }} />
              <span>{T.hiddenTitle}</span>
            </h2>
            <p style={{ ...bodyStyle, margin: 0 }}>{T.hiddenBody}</p>
          </div>
        )}

        {status === 'done' && report && report.learnerCount > 0 && !isCohortReportHidden(report.learnerCount) && (
          <>
            <div style={cardStyle}>
              <h2 style={headingStyle}>
                <Users style={{ width: 24, height: 24 }} />
                <span>{T.activeLearners}</span>
              </h2>
              <p style={{ ...bodyStyle, fontSize: 28, fontWeight: 800, margin: 0, color: '#2B2D6E' }}>{report.learnerCount}</p>
            </div>

            <div style={cardStyle}>
              <h2 style={headingStyle}>
                <BarChart3 style={{ width: 24, height: 24 }} />
                <span>{T.chapterMastery}</span>
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.chapters.map((c) => (
                  <li
                    key={c.topicId}
                    style={{ ...bodyStyle, display: 'flex', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFF8E7', borderRadius: 16, padding: '10px 14px' }}
                  >
                    <span>{c.title}{c.titleEn ? ` (${c.titleEn})` : ''}</span>
                    <strong style={{ color: '#2B2D6E', whiteSpace: 'nowrap' }}>
                      {c.avgMastery === null ? T.noData : percent(c.avgMastery)}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>

            <div style={cardStyle}>
              <h2 style={headingStyle}>
                <Target style={{ width: 24, height: 24 }} />
                <span>{T.weakSkills}</span>
              </h2>
              <ol style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.weakSkills.map((s) => (
                  <li key={s.skillId} style={bodyStyle}>
                    <div>{s.labelTe}</div>
                    <div style={{ fontSize: 18, color: '#4B5563' }}>
                      {s.labelEn} · {percent(s.avgMastery)}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
