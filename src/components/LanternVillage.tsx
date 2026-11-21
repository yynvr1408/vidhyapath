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
    <div className="w-full bg-gradient-to-b from-indigo-dark to-indigo-brand text-white rounded-2xl p-4 shadow-lg mb-4 border border-indigo-500/20">
      <div className="flex items-center justify-between mb-3 border-b border-indigo-400/20 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lantern animate-pulse" />
          <h2 className="text-base font-bold text-cream-100">{pack.uiStrings.villageLanterns || 'పల్లె దీపాల వెలుగులు'}</h2>
        </div>
        <span className="text-xs text-amber-200/90 font-medium">వెలిగే కొద్దీ జ్ఞానం పెరుగుతుంది</span>
      </div>

      {/* Chapters Lantern Grid */}
      <div className="grid grid-cols-2 gap-3">
        {pack.topics.map((topic, idx) => {
          const { percent, masteredCount, totalCount } = PracticeEngine.computeChapterLanternGlow(
            pack,
            topic.id,
            skillStates
          );

          const isFullyLit = percent >= 80;
          const isGlowing = percent > 0;

          return (
            <div
              key={topic.id}
              onClick={() => onSelectTopic && onSelectTopic(topic.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                isFullyLit
                  ? 'bg-amber-500/20 border-lantern lantern-glow text-amber-100'
                  : isGlowing
                  ? 'bg-indigo-light/50 border-amber-400/40 text-cream-100'
                  : 'bg-indigo-900/40 border-indigo-500/20 text-slate-300'
              }`}
            >
              {/* Lantern Graphic */}
              <div className="relative mb-2 flex items-center justify-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isFullyLit
                      ? 'bg-amber-400 text-indigo-dark shadow-lg ring-4 ring-amber-300/60'
                      : isGlowing
                      ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-700/60 text-slate-400'
                  }`}
                >
                  <Flame
                    className={`w-8 h-8 ${
                      isFullyLit
                        ? 'fill-amber-300 text-amber-600 animate-pulse'
                        : isGlowing
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-500'
                    }`}
                  />
                </div>
                {/* Glow badge */}
                <span className="absolute -bottom-1 bg-indigo-dark text-lantern text-[11px] font-bold px-2 py-0.5 rounded-full border border-lantern/40 shadow-xs">
                  {percent}%
                </span>
              </div>

              {/* Chapter Title */}
              <h3 className="font-bold text-sm leading-snug line-clamp-1 mb-1">
                {topic.title}
              </h3>

              {/* Skills Mastered Stats */}
              <div className="text-[11px] text-indigo-200 mt-1">
                {masteredCount} / {totalCount} నైపుణ్యాలు వెలిగాయి
              </div>

              {/* Small Progress Bar */}
              <div className="w-full bg-indigo-950/80 rounded-full h-1.5 mt-2 overflow-hidden border border-indigo-400/20">
                <div
                  className="bg-lantern h-full transition-all duration-500"
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
