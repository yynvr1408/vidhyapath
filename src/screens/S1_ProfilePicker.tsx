import React, { useState } from 'react';
import { Plus, Flame, HeartHandshake, FileCode2, Shield, LogIn, KeyRound, AlertCircle, Edit3, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { PinModal } from '../components/PinModal';
import { StudentAvatar } from '../components/StudentAvatar';
import { EditProfileModal } from '../components/EditProfileModal';
import { VidyapathLogo } from '../components/VidyapathLogo';

export const S1_ProfilePicker: React.FC = () => {
  const { learners, selectLearner, setScreen, pack, loginWithCode, switchPack } = useApp();

  const [enteredCode, setEnteredCode] = useState('');
  const [isCodeConfirmed, setIsCodeConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<LearnerProfile | null>(null);
  const [editingLearner, setEditingLearner] = useState<LearnerProfile | null>(null);

  const isEn = pack?.language === 'en';
  const isHi = pack?.language === 'hi';

  // When clicking an existing profile card: pre-fill their code for fast confirmation
  const handleProfileClick = (profile: LearnerProfile) => {
    setEnteredCode(profile.loginCode || '');
    setIsCodeConfirmed(false);
    setErrorMessage(null);

    if (profile.pinHash) {
      setSelectedProfileForPin(profile);
    }
  };

  // Perform code login
  const handleCodeLogin = async () => {
    if (!enteredCode.trim() || !isCodeConfirmed) return;

    setErrorMessage(null);
    try {
      const result = await loginWithCode(enteredCode);
      if (!result.success) {
        setErrorMessage(
          result.message ||
            (isEn
              ? 'No student profile found with this code. Please check your code.'
              : isHi
              ? 'इस कोड के साथ कोई प्रोफ़ाइल नहीं मिली। कृपया अपना कोड जांचें।'
              : 'ఈ కోడ్‌తో ఏ ప్రొఫైల్ కనుగొనబడలేదు. దయచేసి కోడ్‌ను సరిచూసుకోండి.')
        );
      }
    } catch (err) {
      setErrorMessage(
        isEn
          ? 'Error logging in. Please try again.'
          : isHi
          ? 'लॉगिन करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'లాగిన్ చేయడంలో లోపం జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
      );
    }
  };

  const isLoginDisabled = !enteredCode.trim() || !isCodeConfirmed;

  return (
    <div className="min-h-screen bg-[#F4F9F6] p-4 max-w-md mx-auto flex flex-col justify-between text-[#0F172A]">
      {/* Top Bar with Language Selector */}
      <div className="flex items-center justify-between pb-2 pt-1">
        <span className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
          {isEn ? 'Class 10 Maths' : isHi ? 'कक्षा 10 गणित' : '10వ తరగతి గణితం'}
        </span>
        <div className="relative flex items-center">
          <BookOpen className="w-3.5 h-3.5 text-[#15803D] absolute left-2.5 pointer-events-none" />
          <select
            value={pack?.id || 'te-10-maths-ap'}
            onChange={(e) => switchPack(e.target.value)}
            title="Switch Language Pack / భాష మార్చు"
            className="text-xs bg-[#FFFFFF] hover:bg-[#DCFCE7] text-[#0F172A] font-bold pl-7 pr-2.5 py-1.5 rounded-xl border border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden min-h-[38px] transition-all cursor-pointer shadow-2xs"
          >
            <option value="te-10-maths-ap">తెలుగు (Telugu)</option>
            <option value="en-10-maths-cbse">English (CBSE)</option>
            <option value="hi-10-maths-cbse">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Creative Vidyapath Vector Logo & Header Info */}
      <div className="text-center pt-3 pb-3 flex flex-col items-center">
        <VidyapathLogo size="lg" showWordmark={true} className="mb-2" />
        <p className="text-xs text-[#475569] mt-1 font-medium">
          {pack?.uiStrings.whoIsLearning ||
            (isEn ? 'Who is learning today?' : isHi ? 'आज कौन पढ़ाई कर रहा है?' : 'ఎవరు చదువుకుంటున్నారు?')}
        </p>
      </div>

      <div className="flex-1 py-2 flex flex-col gap-4">
        {/* Direct Unique Code Login Box */}
        <div className="bg-[#FFFFFF] p-4.5 rounded-3xl border border-[#D1E7DD] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-[#15803D]" />
            <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              {isEn
                ? 'Personal Student Login Code:'
                : isHi
                ? 'विशेष छात्र लॉगिन कोड:'
                : 'ప్రత్యేక విద్యార్థి లాగిన్ కోడ్:'}
            </span>
          </div>

          <div className="relative mb-3">
            <input
              type="text"
              value={enteredCode}
              onChange={(e) => {
                setEnteredCode(e.target.value.toUpperCase());
                setErrorMessage(null);
              }}
              placeholder={
                isEn
                  ? 'e.g. PRIYA-10 or VP-4829'
                  : isHi
                  ? 'उदा: PRIYA-10 या VP-4829'
                  : 'ఉదా: PRIYA-10 లేదా VP-4829'
              }
              className="w-full text-center text-lg font-mono font-black tracking-wider py-3.5 px-4 rounded-xl bg-[#F4F9F6] border-2 border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          {/* Helper Error if code not found */}
          {errorMessage && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 mb-3 animate-fadeIn">
              <div className="flex items-start gap-2 text-xs text-[#DC2626] font-medium mb-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setScreen('S2_CREATE')}
                className="w-full py-2 px-3 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold text-[#DC2626] transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {isEn
                    ? '+ Create New Student Code'
                    : isHi
                    ? '+ नया छात्र कोड बनाएं'
                    : 'కొత్త విద్యార్థి కోడ్ సృష్టించండి (Create New Code)'}
                </span>
              </button>
            </div>
          )}

          {/* Mandatory Confirmation Checkbox */}
          <div className="mb-3 p-3 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD]">
            <label className="flex items-center gap-3 cursor-pointer min-h-[48px] select-none">
              <input
                type="checkbox"
                checked={isCodeConfirmed}
                onChange={(e) => setIsCodeConfirmed(e.target.checked)}
                className="w-5 h-5 rounded-md bg-[#FFFFFF] border-2 border-[#D1E7DD] text-[#15803D] focus:ring-[#15803D] focus:ring-offset-0 cursor-pointer accent-[#15803D]"
              />
              <span className="font-semibold text-xs text-[#0F172A]">
                {isEn
                  ? 'Confirm Code to Login'
                  : isHi
                  ? 'लॉगिन के लिए कोड की पुष्टि करें'
                  : 'కోడ్ నిర్ధారించండి (Confirm Code to Login)'}
              </span>
            </label>
          </div>

          {/* Primary #15803D CTA Button */}
          <button
            type="button"
            onClick={handleCodeLogin}
            disabled={isLoginDisabled}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[56px] ${
              isLoginDisabled
                ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-70'
                : 'bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF] shadow-emerald-700/20'
            }`}
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isEn
                ? 'Login to Vidyapath'
                : isHi
                ? 'विद्यापथ में लॉगिन करें'
                : 'లాగిన్ (Login to Vidyapath)'}
            </span>
          </button>
        </div>

        {/* Existing Learner Profiles on this Family Phone */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
              {isEn
                ? `Saved Students on this Phone (${learners.length}):`
                : isHi
                ? `इस फोन पर सहेजे गए शिक्षार्थी (${learners.length}):`
                : `ఈ ఫోన్‌లో సేవ్ చేసిన విద్యార్థులు (${learners.length}):`}
            </span>
            <span className="text-[11px] text-[#475569]">
              {isEn ? 'Tap to select code' : isHi ? 'कोड चुनने के लिए टैप करें' : 'ట్యాప్ చేసి కోడ్ ఎంచుకోండి'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {learners.map((learner) => {
              const isSelected = enteredCode === learner.loginCode;
              return (
                <div
                  key={learner.id}
                  className={`relative p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center text-center group min-h-[148px] shadow-xs ${
                    isSelected
                      ? 'bg-[#DCFCE7] border-[#15803D] shadow-md shadow-emerald-600/15'
                      : 'bg-[#FFFFFF] border-[#D1E7DD] hover:border-[#86EFAC]'
                  }`}
                >
                  {/* Edit profile mini button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLearner(learner);
                    }}
                    title={isEn ? 'Edit Profile' : isHi ? 'प्रोफ़ाइल बदलें' : 'ప్రొఫైల్ మార్చండి'}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#F4F9F6] hover:bg-[#DCFCE7] border border-[#D1E7DD] text-[#475569] hover:text-[#15803D] z-10 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProfileClick(learner)}
                    className="w-full flex flex-col items-center text-center active:scale-95"
                  >
                    <StudentAvatar learner={learner} size="lg" className="mb-2" />
                    <span className="font-bold text-sm text-[#0F172A] group-hover:text-[#15803D] transition-colors line-clamp-1">
                      {learner.nickname}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#15803D] mt-0.5 bg-[#F4F9F6] px-2 py-0.5 rounded-md border border-[#D1E7DD]">
                      {learner.loginCode || 'VP-CODE'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#16A34A] mt-1.5 font-bold">
                      <Flame className="w-3 h-3 fill-[#16A34A]" />
                      <span>{isEn ? 'Lantern Glow' : isHi ? 'लालटेन चमक' : 'లాంతరు వెలుగు'}</span>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Add Learner Tile */}
            <button
              type="button"
              onClick={() => setScreen('S2_CREATE')}
              className="bg-[#FFFFFF] hover:bg-[#F0FDF4] p-4 rounded-2xl border-2 border-dashed border-[#D1E7DD] hover:border-[#15803D] transition-all flex flex-col items-center justify-center text-center active:scale-95 min-h-[148px] shadow-xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center justify-center mb-2">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-[#0F172A]">
                {pack?.uiStrings.addNewLearner ||
                  (isEn ? '+ Add Student' : isHi ? '+ नया शिक्षार्थी' : '+ కొత్త విద్యార్థి')}
              </span>
              <span className="text-[10px] text-[#475569] mt-0.5 font-medium">
                {isEn ? 'Create personal code' : isHi ? 'अपना कोड बनाएं' : 'సొంత కోడ్ సృష్టించండి'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editingLearner && (
        <EditProfileModal
          learner={editingLearner}
          isOpen={!!editingLearner}
          onClose={() => setEditingLearner(null)}
          requireCodeVerification={true}
        />
      )}

      {/* PIN Modal check if learner set a PIN */}
      {selectedProfileForPin && (
        <PinModal
          expectedPin={selectedProfileForPin.pinHash}
          onSuccess={() => {
            selectLearner(selectedProfileForPin);
            setSelectedProfileForPin(null);
          }}
          onCancel={() => setSelectedProfileForPin(null)}
        />
      )}

      {/* Footer Navigation: Guardian, Sponsor Impact, Pack Editor */}
      <div className="pt-4 border-t border-[#D1E7DD]">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setScreen('S10_GUARDIAN')}
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#DCFCE7] border border-[#D1E7DD] text-[#0F172A] min-h-[48px] shadow-xs"
          >
            <Shield className="w-4 h-4 text-[#059669]" />
            <span>{isEn ? 'Guardian View' : isHi ? 'अभिभावक दृश्य' : 'సంరక్షకుని వ్యూ'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('S11_IMPACT')}
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#DCFCE7] border border-[#D1E7DD] text-[#0F172A] min-h-[48px] shadow-xs"
          >
            <HeartHandshake className="w-4 h-4 text-[#16A34A]" />
            <span>{isEn ? 'Sponsor Impact' : isHi ? 'प्रायोजक प्रभाव' : 'స్పాన్సర్ ఇంపాక్ట్'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('S12_PACK_EDITOR')}
            className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#DCFCE7] border border-[#D1E7DD] text-[#0F172A] min-h-[48px] shadow-xs"
          >
            <FileCode2 className="w-4 h-4 text-[#0D9488]" />
            <span>{isEn ? 'Pack Editor' : isHi ? 'पैक संपादक' : 'ప్యాక్ ఎడిటర్'}</span>
          </button>
        </div>
        <p className="text-[11px] text-[#475569] text-center mt-3 font-medium">
          {isEn
            ? 'Zero-PII Privacy: No personal phone numbers or emails collected.'
            : isHi
            ? 'गोपनीयता: कोई व्यक्तिगत फोन नंबर या ईमेल एकत्र नहीं किए जाते हैं।'
            : 'గోప్యత: ఎలాంటి వ్యక్తిగత ఫోన్ నంబర్లు, ఈమెయిళ్లు సేకరించబడవు.'}
        </p>
      </div>
    </div>
  );
};
