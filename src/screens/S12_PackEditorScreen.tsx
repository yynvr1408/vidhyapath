import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, FileCode2, Upload, Save, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_BASE } from '../config/api';

export const S12_PackEditorScreen: React.FC = () => {
  const { pack, setScreen, switchPack, activeLearner } = useApp();

  const [jsonText, setJsonText] = useState<string>('');
  const [validationReport, setValidationReport] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    summary?: any;
  } | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (pack) {
      setJsonText(JSON.stringify(pack, null, 2));
      validateJson(JSON.stringify(pack, null, 2));
    }
  }, [pack]);

  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!parsed.id) errors.push('Missing required field: "id"');
      if (!parsed.version) errors.push('Missing required field: "version"');
      if (!parsed.language) errors.push('Missing required field: "language"');
      if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
        errors.push('Pack must contain at least 1 topic in topics[]');
      }
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        errors.push('Pack must contain questions array');
      }

      // Check duplicates & skill references
      const qIds = new Set<string>();
      const allSkills = new Set<string>();

      if (parsed.topics && Array.isArray(parsed.topics)) {
        for (const t of parsed.topics) {
          if (t.skills && Array.isArray(t.skills)) {
            for (const s of t.skills) allSkills.add(s);
          }
        }
      }

      if (parsed.questions && Array.isArray(parsed.questions)) {
        for (const q of parsed.questions) {
          if (qIds.has(q.id)) {
            errors.push(`Duplicate question id: "${q.id}"`);
          }
          qIds.add(q.id);

          if (!q.skillId || !allSkills.has(q.skillId)) {
            errors.push(`Question "${q.id}" references unknown skillId: "${q.skillId}"`);
          }

          if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
            errors.push(`Question "${q.id}" has invalid answer key: "${q.answer}" (must be A, B, C, or D)`);
          }

          if (!q.hintLadder || q.hintLadder.length < 3) {
            warnings.push(`Question "${q.id}" has fewer than 3 hints in hintLadder`);
          }
        }
      }

      setValidationReport({
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
          topicsCount: parsed.topics?.length || 0,
          skillsCount: allSkills.size,
          questionsCount: parsed.questions?.length || 0,
        },
      });
    } catch (err: any) {
      setValidationReport({
        valid: false,
        errors: ['JSON సింటాక్స్ లోపం: ' + err.message],
        warnings: [],
      });
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    validateJson(text);
  };

  const handlePublish = async () => {
    if (!validationReport || !validationReport.valid) return;

    setIsPublishing(true);
    setPublishMessage(null);

    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch(API_BASE + '/api/admin/packs/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setPublishMessage(`ప్యాక్ "${parsed.id}" వెర్షన్ ${parsed.version} విజయవంతంగా పబ్లిష్ అయింది!`);
        await switchPack(parsed.id);
      } else {
        setPublishMessage('పబ్లిష్ చేయడంలో లోపం సంభవించింది.');
      }
    } catch (err: any) {
      setPublishMessage('పబ్లిష్ విఫలమైంది: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Header */}
      <header className="bg-indigo-brand text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-indigo-light hover:bg-indigo-dark text-white active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-base block leading-tight">కంటెంట్ ప్యాక్ ఎడిటర్</span>
              <span className="text-[11px] text-amber-300">Content Admin & Pack Validator</span>
            </div>
          </div>
          <FileCode2 className="w-6 h-6 text-lantern" />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Pack Selector */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">ఎడిట్ చేయవలసిన ప్యాక్:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchPack('te-10-maths-ap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                pack?.id === 'te-10-maths-ap'
                  ? 'bg-indigo-brand text-amber-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              తెలుగు క్లాస్ 10
            </button>
            <button
              type="button"
              onClick={() => switchPack('hi-10-maths-cbse')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                pack?.id === 'hi-10-maths-cbse'
                  ? 'bg-indigo-brand text-amber-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              హిందీ స్టబ్
            </button>
          </div>
        </div>

        {/* Live Validation Status Banner */}
        {validationReport && (
          <div
            className={`p-4 rounded-2xl border-2 transition-all ${
              validationReport.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm mb-1">
              <div className="flex items-center gap-2">
                {validationReport.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span>
                  {validationReport.valid ? 'స్కీమా చెల్లుబాటు అయింది (Valid Pack)' : 'స్కీమాలో లోపాలు ఉన్నాయి'}
                </span>
              </div>
              {validationReport.summary && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200">
                  {validationReport.summary.questionsCount} ప్రశ్నలు · {validationReport.summary.topicsCount} చాప్టర్లు
                </span>
              )}
            </div>

            {/* Error List */}
            {validationReport.errors.length > 0 && (
              <ul className="text-xs list-disc list-inside mt-2 space-y-1 text-red-700">
                {validationReport.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}

            {/* Warning List */}
            {validationReport.warnings.length > 0 && (
              <ul className="text-xs list-disc list-inside mt-2 space-y-1 text-amber-700">
                {validationReport.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* JSON Editor Textarea */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 pb-2 border-b border-slate-800">
            <span>content_pack.json</span>
            <span>UTF-8 · JSON</span>
          </div>

          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            rows={14}
            className="w-full flex-1 bg-transparent font-mono text-xs text-emerald-400 focus:outline-hidden leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>

        {/* Publish Message Alert */}
        {publishMessage && (
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-300">
            {publishMessage}
          </div>
        )}

        {/* Publish CTA Button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!validationReport?.valid || isPublishing}
          className="w-full py-4 rounded-2xl bg-indigo-brand hover:bg-indigo-dark disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
        >
          <Save className="w-5 h-5 text-lantern" />
          <span>{isPublishing ? 'పబ్లిష్ అవుతోంది...' : 'ప్యాక్ సరిచూసి పబ్లిష్ చేయి (Publish Version)'}</span>
        </button>
      </main>
    </div>
  );
};
