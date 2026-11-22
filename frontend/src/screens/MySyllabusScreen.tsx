import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MySyllabusScreen: React.FC = () => {
  const {
    pack,
    selectTopic,
    setScreen,
    completedChapters,
    toggleChapterCompletion,
    offlineChapters,
    toggleChapterOffline,
    t,
  } = useApp();

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(() => {
    return pack?.topics?.[0]?.id || 'ch1_real_numbers';
  });

  const topics = pack?.topics || [];

  const handleAskTutor = (topicId: string, conceptTitle?: string) => {
    selectTopic(topicId, conceptTitle);
    setScreen('AI_TUTOR');
  };

  const handlePractice = (topicId: string) => {
    selectTopic(topicId);
    setScreen('PRACTICE');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Class {pack?.class || 10} • {pack?.subject || 'Mathematics'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0F172A]">
            {t.mySyllabusTitle || 'My Syllabus (Learn)'}
          </h2>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Real state-board Class 10 curriculum with step-by-step concepts, worked examples, and instant AI explanations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-[#475569] bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] self-start sm:self-auto shrink-0">
          <span>{completedChapters.length} / {topics.length} Chapters Done</span>
        </div>
      </div>

      {/* Chapters Accordion / List */}
      <div className="space-y-4">
        {topics.map((topic, index) => {
          const isExpanded = expandedChapterId === topic.id;
          const isCompleted = completedChapters.includes(topic.id);
          const isSavedOffline = offlineChapters.has(topic.id);

          return (
            <div
              key={topic.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-xs ${
                isExpanded ? 'border-[#0F766E]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              {/* Chapter Card Header */}
              <div
                onClick={() => setExpandedChapterId(isExpanded ? null : topic.id)}
                className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center space-x-3.5 truncate">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#CCFBF1] text-[#0F766E]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : index + 1}
                  </span>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-base md:text-lg text-[#0F172A] truncate">
                        {topic.title}
                      </h3>
                      {isSavedOffline && (
                        <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B]">
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate max-w-md">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChapterOffline(topic.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 border transition-colors ${
                      isSavedOffline
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    title={isSavedOffline ? 'Saved for offline use' : 'Save for offline'}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden lg:inline">{isSavedOffline ? 'Saved' : 'Save'}</span>
                  </button>

                  <div className="p-1 text-[#64748B]">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Chapter Card Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-5 md:px-6 md:pb-6 border-t border-[#E2E8F0] pt-4 space-y-5 bg-[#FAFAFA]">
                  {/* Action Shortcuts */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAskTutor(topic.id)}
                      className="px-4 py-2 bg-[#0F766E] hover:bg-[#0D6962] text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.navAiTutor || 'Ask AI Tutor About Chapter'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePractice(topic.id)}
                      className="px-4 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Award className="w-4 h-4 text-[#D97706]" />
                      <span>{t.practiceNow || 'Practice Chapter Questions'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChapterCompletion(topic.id)}
                      className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ml-auto ${
                        isCompleted
                          ? 'bg-[#10B981] text-white border-[#10B981]'
                          : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isCompleted ? 'Completed' : 'Mark as Done'}</span>
                    </button>
                  </div>

                  {/* Concept Cards */}
                  {topic.cards && topic.cards.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        Core Concepts & Worked Solutions ({topic.cards.length})
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        {topic.cards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-white p-4 md:p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-md bg-[#CCFBF1] text-[#0F766E] font-bold text-xs flex items-center justify-center">
                                  {card.stepNumber}
                                </span>
                                <h5 className="font-bold text-sm md:text-base text-[#0F172A]">
                                  {card.heading}
                                </h5>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAskTutor(topic.id, card.heading)}
                                className="text-xs font-bold text-[#0F766E] hover:text-[#0D6962] flex items-center space-x-1 hover:underline"
                              >
                                <span>Explain</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs md:text-sm text-[#334155] leading-relaxed">
                              {card.conceptText}
                            </p>

                            {card.workedExample && (
                              <div className="p-3.5 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] space-y-2 text-xs md:text-sm">
                                <div className="font-bold text-[#0F766E] flex items-center space-x-1.5">
                                  <Lightbulb className="w-4 h-4" />
                                  <span>{t.workedExample || 'Worked Example'}: {card.workedExample.problem}</span>
                                </div>
                                <div className="space-y-1 pl-5">
                                  {card.workedExample.steps.map((st, sIdx) => (
                                    <p key={sIdx} className="text-[#134E4A] font-medium">
                                      {sIdx + 1}. {st}
                                    </p>
                                  ))}
                                </div>
                                {card.workedExample.finalAnswer && (
                                  <p className="font-bold text-[#0F766E] pt-1">
                                    {t.finalAnswer || 'Answer'}: {card.workedExample.finalAnswer}
                                  </p>
                                )}
                              </div>
                            )}

                            {card.keyTakeaway && (
                              <div className="text-[11px] md:text-xs text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                                <strong className="text-[#475569]">{t.keyTakeaway || 'Key Rule'}:</strong> {card.keyTakeaway}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Skills Chips fallback */
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        Key Skills Covered
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {topic.skills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleAskTutor(topic.id, skill)}
                            className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F766E] hover:border-[#0F766E] hover:bg-[#F0FDFA] transition-colors"
                          >
                            {skill} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
