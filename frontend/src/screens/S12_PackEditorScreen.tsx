import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, FileCode2, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
            errors.push(`Question "${q.id}" references unmapped skillId: "${q.skillId}"`);
          }
        }
      }

      setValidationReport({
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
          questionsCount: parsed.questions?.length || 0,
          topicsCount: parsed.topics?.length || 0,
          version: parsed.version,
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
      const res = await fetch('/api/admin/packs/publish', {
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
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-base block leading-tight">కంటెంట్ ప్యాక్ ఎడిటర్</span>
              <span className="text-[11px] text-[#15803D] font-bold">Content Admin & Pack Validator</span>
            </div>
          </div>
          <FileCode2 className="w-6 h-6 text-[#15803D]" />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Pack Selector */}
        <div className="flex items-center justify-between bg-[#FFFFFF] p-3 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <span className="text-xs font-bold text-[#475569]">ఎడిట్ చేయవలసిన ప్యాక్:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchPack('te-10-maths-ap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pack?.id === 'te-10-maths-ap'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-[#F4F9F6] text-[#475569] border border-[#D1E7DD]'
              }`}
            >
              తెలుగు క్లాస్ 10
            </button>
            <button
              type="button"
              onClick={() => switchPack('hi-10-maths-cbSE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pack?.id === 'hi-10-maths-cbse'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-[#F4F9F6] text-[#475569] border border-[#D1E7DD]'
              }`}
            >
              హిందీ స్టబ్
            </button>
          </div>
        </div>

        {/* Live Validation Status Banner */}
        {validationReport && (
          <div
            className={`p-4 rounded-2xl border transition-all ${
              validationReport.valid
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#059669]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm mb-1">
              <div className="flex items-center gap-2">
                {validationReport.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                )}
                <span>
                  {validationReport.valid ? 'స్కీమా చెల్లుబాటు అయింది (Valid Pack)' : 'స్కీమాలో లోపాలు ఉన్నాయి'}
                </span>
              </div>
              {validationReport.summary && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-[#D1E7DD] text-[#0F172A]">
                  {validationReport.summary.questionsCount} ప్రశ్నలు · {validationReport.summary.topicsCount} చాప్టర్లు
                </span>
              )}
            </div>

            {/* Error List */}
            {validationReport.errors.length > 0 && (
              <ul className="text-xs list-disc list-inside mt-2 space-y-1 text-[#DC2626] font-medium">
                {validationReport.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}

            {/* Warning List */}
            {validationReport.warnings.length > 0 && (
              <ul className="text-xs list-disc list-inside mt-2 space-y-1 text-[#CA8A04] font-medium">
                {validationReport.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* JSON Editor Textarea */}
        <div className="flex-1 flex flex-col bg-[#FFFFFF] rounded-3xl p-4 shadow-xs border border-[#D1E7DD]">
          <div className="flex items-center justify-between text-xs text-[#475569] font-mono mb-2 pb-2 border-b border-[#D1E7DD]">
            <span>content_pack.json</span>
            <span>UTF-8 · JSON</span>
          </div>

          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            rows={14}
            className="w-full flex-1 bg-[#F4F9F6] p-3 rounded-xl border border-[#D1E7DD] font-mono text-xs text-[#0F172A] focus:border-[#15803D] focus:outline-hidden leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>

        {/* Publish Message Alert */}
        {publishMessage && (
          <div className="p-3 bg-[#DCFCE7] text-[#059669] rounded-xl text-xs font-bold text-center border border-[#86EFAC]">
            {publishMessage}
          </div>
        )}

        {/* Publish CTA Button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!validationReport?.valid || isPublishing}
          className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>{isPublishing ? 'పబ్లిష్ అవుతోంది...' : 'ప్యాక్ సరిచూసి పబ్లిష్ చేయి (Publish Version)'}</span>
        </button>
      </main>
    </div>
  );
};
