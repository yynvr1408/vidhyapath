import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PracticeEngine } from '../engine/practiceEngine';

interface LanternVillageProps {
  onSelectTopic?: (topicId: string) => void;
}

export const LanternVillage: React.FC<LanternVillageProps> = ({ onSelectTopic }) => {
  const { pack, skillStates } = useApp();

  if (!pack || !pack.topics) return null;

  return (
    <div className="w-full bg-[#FFFFFF] text-[#0F172A] rounded-3xl p-4.5 shadow-sm mb-4 border border-[#D1E7DD]">
      <div className="flex items-center justify-between mb-3.5 border-b border-[#D1E7DD] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#16A34A] animate-pulse" />
          <h2 className="text-base font-bold text-[#0F172A]">{pack.uiStrings.villageLanterns || 'పల్లె దీపాల వెలుగులు'}</h2>
        </div>
        <span className="text-xs text-[#15803D] font-bold">వెలిగే కొద్దీ జ్ఞానం పెరుగుతుంది</span>
      </div>

      {/* Chapters Lantern Grid */}
      <div className="grid grid-cols-2 gap-3">
        {pack.topics.map((topic) => {
          const { percent, masteredCount, totalCount } = PracticeEngine.computeChapterLanternGlow(
            pack,
            topic.id,
            skillStates
          );

          const isFullyLit = percent >= 80;
          const isGlowing = percent > 0;

          // Glow shadow proportional to chapter mastery
          const glowShadowStyle = isGlowing
            ? { boxShadow: `0 0 ${Math.max(8, Math.round(percent * 0.22))}px rgba(22, 163, 74, ${Math.max(0.2, percent * 0.0035)})` }
            : {};

          return (
            <div
              key={topic.id}
              onClick={() => onSelectTopic && onSelectTopic(topic.id)}
              style={glowShadowStyle}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center active:scale-95 ${
                isFullyLit
                  ? 'bg-[#DCFCE7] border-[#16A34A] lantern-glow text-[#0F172A]'
                  : isGlowing
                  ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#0F172A]'
                  : 'bg-[#F4F9F6] border-[#D1E7DD] text-[#475569] hover:border-[#86EFAC]'
              }`}
            >
              {/* Lantern Graphic */}
              <div className="relative mb-2 flex items-center justify-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isFullyLit
                      ? 'bg-[#16A34A] text-[#FACC15] shadow-md ring-4 ring-[#86EFAC]'
                      : isGlowing
                      ? 'bg-[#DCFCE7] text-[#16A34A] ring-2 ring-[#86EFAC]'
                      : 'bg-[#FFFFFF] text-[#94A3B8] border border-[#D1E7DD]'
                  }`}
                >
                  <Flame
                    className={`w-7 h-7 ${
                      isFullyLit
                        ? 'fill-[#FACC15] text-[#FACC15] animate-pulse'
                        : isGlowing
                        ? 'fill-[#16A34A] text-[#16A34A]'
                        : 'text-[#94A3B8]'
                    }`}
                  />
                </div>
                {/* Glow badge */}
                <span className="absolute -bottom-1 bg-[#FFFFFF] text-[#15803D] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#D1E7DD] shadow-xs">
                  {percent}%
                </span>
              </div>

              {/* Chapter Title */}
              <h3 className="font-bold text-sm leading-snug line-clamp-1 mb-1 text-[#0F172A]">
                {topic.title}
              </h3>

              {/* Skills Mastered Stats */}
              <div className="text-[11px] text-[#475569] mt-0.5 font-medium">
                {masteredCount} / {totalCount} నైపుణ్యాలు వెలిగాయి
              </div>

              {/* Small Progress Bar */}
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2.5 overflow-hidden border border-[#D1E7DD]">
                <div
                  className="bg-[#16A34A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
