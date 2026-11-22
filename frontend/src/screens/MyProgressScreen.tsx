import React from 'react';
import {
  BarChart2,
  CheckCircle,
  AlertTriangle,
  Award,
  ArrowRight,
  Flame,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MyProgressScreen: React.FC = () => {
  const {
    pack,
    completedChapters,
    weakTopics,
    quizAttempts,
    setScreen,
    selectTopic,
    t,
  } = useApp();

  const totalChapters = pack?.topics?.length || 4;
  const completedCount = completedChapters.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalChapters) * 100));

  // Compute quiz accuracy
  const totalQuizzes = quizAttempts.length;
  const correctCount = quizAttempts.filter((a) => a.correct).length;
  const accuracyPercent = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : 85;

  const handleReviseTopic = (topicId: string) => {
    selectTopic(topicId);
    setScreen('MY_SYLLABUS');
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold mb-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Class 10 Learning Mastery</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0F172A]">
            {t.navProgress || 'My Progress & Growth'}
          </h2>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Track your chapter completions, accuracy trends, and targeted weak topics to revise.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#FEF3C7] text-[#B45309] px-3.5 py-2 rounded-xl border border-[#FDE68A] text-xs font-bold shrink-0 self-start sm:self-auto">
          <Flame className="w-4 h-4 text-[#D97706]" />
          <span>4-Day Active Streak!</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Chapters Completed */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Chapters Done</span>
            <CheckCircle className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#0F172A]">{completedCount}</span>
            <span className="text-xs text-[#64748B]">/ {totalChapters} chapters</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">{progressPercent}% Syllabus Mastery</p>
        </div>

        {/* Quiz Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Practice Accuracy</span>
            <Award className="w-5 h-5 text-[#0F766E]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#0F766E]">{accuracyPercent}%</span>
            <span className="text-xs text-[#64748B]">({correctCount} / {Math.max(1, totalQuizzes)})</span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0F766E] h-full rounded-full transition-all duration-500"
              style={{ width: `${accuracyPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">Strong performance across quizzes</p>
        </div>

        {/* Weak Topics to Revise */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Weak Topics</span>
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#D97706]">{weakTopics.length}</span>
            <span className="text-xs text-[#64748B]">topics flagged</span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#F59E0B] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, weakTopics.length * 25)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">Targeted for retention revision</p>
        </div>
      </div>

      {/* Weak Topics Section with Revise Now Action */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#0F172A]">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            <h3 className="font-extrabold text-base md:text-lg">
              {t.topicsToRevise || 'Topics Recommended for Revision'}
            </h3>
          </div>
          <span className="text-xs text-[#64748B]">Adaptive AI Recommendations</span>
        </div>

        {weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {weakTopics.map((topicId) => {
              const matchedTopic = pack?.topics?.find((t) => t.id === topicId);
              const title = matchedTopic?.title || topicId.replace(/_/g, ' ');
              return (
                <div
                  key={topicId}
                  className="p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#92400E]">{title}</h4>
                    <p className="text-xs text-[#B45309] mt-0.5">Missed recent quiz question</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReviseTopic(topicId)}
                    className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1 shrink-0"
                  >
                    <span>{t.reviseNow || 'Revise'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <CheckCircle className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
            <p className="font-bold text-sm text-[#0F172A]">All Topics in Strong Standing!</p>
            <p className="text-xs text-[#64748B] mt-0.5">Great job! You have no weak topics flagged right now.</p>
          </div>
        )}
      </div>

      {/* Weekly Activity Streak Grid */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-[#0F172A]">
          <Calendar className="w-5 h-5 text-[#0F766E]" />
          <h3 className="font-extrabold text-base md:text-lg">
            {t.weeklyStreak || 'Weekly Learning Streak'}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {DAYS.map((day, idx) => {
            const isActive = idx < 4; // Mon-Thu active
            return (
              <div
                key={day}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  isActive
                    ? 'bg-[#F0FDFA] border-[#0F766E] text-[#0F766E] font-bold shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span className="text-[11px] font-bold uppercase">{day}</span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive ? 'bg-[#0F766E] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  {isActive ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
