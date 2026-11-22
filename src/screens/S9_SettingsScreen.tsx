import React, { useState } from 'react';
import { ArrowLeft, Database, Type, Trash2, Users, HardDrive, Check, Edit3, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { StudentAvatar } from '../components/StudentAvatar';
import { EditProfileModal } from '../components/EditProfileModal';
import { AppUpdateButton } from '../components/AppUpdateButton';

export const S9_SettingsScreen: React.FC = () => {
  const {
    activeLearner,
    lowDataMode,
    toggleLowDataMode,
    fontSize,
    setFontSize,
    dataUsedKb,
    clearAiCache,
    switchLearner,
    setScreen,
  } = useApp();

  const [cacheCleared, setCacheCleared] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleClearCache = async () => {
    await clearAiCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base">సెట్టింగులు (Settings)</span>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 space-y-4">
        {/* Active Profile Info & Edit Profile Trigger */}
        {activeLearner && (
          <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StudentAvatar learner={activeLearner} size="lg" />
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">{activeLearner.nickname}</h3>
                <p className="text-xs text-[#475569] font-medium">
                  లాగిన్ కోడ్: <span className="font-mono text-[#15803D] font-bold">{activeLearner.loginCode}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-xs font-bold text-[#14532D] flex items-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
            >
              <Edit3 className="w-4 h-4 text-[#15803D]" />
              <span>ప్రొఫైల్ మార్చు</span>
            </button>
          </div>
        )}

        {/* 1. Low-Data Mode Toggle */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-[#15803D]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">తక్కువ డేటా మోడ్ (Low Data Mode)</h3>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed font-medium">
                  డేటాను ఆదా చేస్తుంది. చిత్రాలు మరియు బాహ్య కాల్స్ నిలిపివేయబడతాయి. ఆన్-డివైస్ తెలుగు ఆడియో మాత్రమే పనిచేస్తుంది.
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={toggleLowDataMode}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                lowDataMode ? 'bg-[#15803D] justify-end' : 'bg-[#CBD5E1] justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
            </button>
          </div>
        </div>

        {/* 2. Font Size Selector */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#0D9488] border border-[#86EFAC] flex items-center justify-center shrink-0">
              <Type className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">అక్షరాల పరిమాణం (Font Size)</h3>
              <p className="text-xs text-[#475569] font-medium">తెలుగు లిపి స్పష్టంగా చదవడానికి:</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'సాధారణం (18px)', size: 'normal' },
              { id: 'large', label: 'పెద్దది (20px)', size: 'large' },
              { id: 'xlarge', label: 'మరింత పెద్దది (22px)', size: 'xlarge' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontSize(f.size as any)}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border text-center min-h-[48px] ${
                  fontSize === f.size
                    ? 'bg-[#15803D] text-white border-[#15803D] shadow-xs'
                    : 'bg-[#F4F9F6] text-[#475569] border-[#D1E7DD] hover:border-[#15803D]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Session Data Usage & AI Cache Counter */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#16A34A]" />
              <span className="font-bold text-sm text-[#0F172A]">డేటా వినియోగం & కాష్</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#14532D] bg-[#DCFCE7] px-2.5 py-1 rounded-md border border-[#86EFAC]">
              {dataUsedKb} KB ఖర్చయింది
            </span>
          </div>

          <p className="text-xs text-[#475569] mb-3 leading-relaxed font-medium">
            విద్యాపథ్ మొత్తం ఆఫ్‌లైన్‌లో సేవ్ చేస్తుంది. ఆన్‌లైన్ ట్యూటర్ కాష్‌ను క్లియర్ చేయడం వల్ల ఫోన్ మెమరీ ఆదా అవుతుంది.
          </p>

          <button
            type="button"
            onClick={handleClearCache}
            disabled={cacheCleared}
            className="w-full py-3 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-xs font-bold text-[#DC2626] border border-[#FECACA] flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
          >
            {cacheCleared ? (
              <>
                <Check className="w-4 h-4 text-[#059669]" />
                <span className="text-[#059669]">కాష్ క్లియర్ చేయబడింది!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>AI ట్యూటర్ కాష్‌ను క్లియర్ చేయి (Free Memory)</span>
              </>
            )}
          </button>
        </div>

        {/* 4. App Version & Updates */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#15803D]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">యాప్ అప్‌డేట్‌లు & వెర్షన్ (App Updates)</h3>
              <p className="text-xs text-[#475569] font-medium">కొత్త వెర్షన్లు, భద్రతా అప్‌డేట్‌లు మరియు ఫీచర్లు తనిఖీ చేయండి.</p>
            </div>
          </div>
          <AppUpdateButton />
        </div>

        {/* 5. Shared Phone Learner Switcher */}
        <div className="pt-2">
          <button
            type="button"
            onClick={switchLearner}
            className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
          >
            <Users className="w-5 h-5 stroke-[2.5]" />
            <span>విద్యార్థిని మార్చు (Switch Learner on Shared Phone)</span>
          </button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && activeLearner && (
        <EditProfileModal
          learner={activeLearner}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          requireCodeVerification={false}
        />
      )}
    </div>
  );
};
