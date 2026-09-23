import React from 'react';
import {
  LayoutDashboard,
  Award,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  PlusCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { QuizResultRecord, StudentDashboardStats } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getScoreLabel } from '../utils/storage';

interface DashboardViewProps {
  stats: StudentDashboardStats;
  recentQuizzes: QuizResultRecord[];
  onSelectQuiz: (quiz: QuizResultRecord) => void;
  onNewQuiz: () => void;
  onViewAllHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentQuizzes,
  onSelectQuiz,
  onNewQuiz,
  onViewAllHistory,
}) => {
  const { t, language } = useLanguage();

  const getDifficultyLabel = (diff: string) => {
    if (diff === 'easy') return t.config.difficultyEasy;
    if (diff === 'hard') return t.config.difficultyHard;
    if (diff === 'mixed') return t.config.difficultyMixed;
    return t.config.difficultyMedium;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
              {t.dashboard.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.dashboard.subtitle}
          </p>
        </div>

        <button
          id="btn-dash-new-quiz"
          onClick={onNewQuiz}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.dashboard.uploadNewBook}</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-10">
        {/* Total Quizzes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.totalQuizzes}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-3xl font-black text-slate-900">
            {stats.totalQuizzes}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.dashboard.quizzedBooks}</p>
        </div>

        {/* Questions Answered */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.questionsAnswered}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-3xl font-black text-slate-900">
            {stats.questionsAnswered}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.dashboard.activeRecall}</p>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.averageScore}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-3xl font-black text-slate-900">
            {stats.averageScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.dashboard.allQuizzesTaken}</p>
        </div>

        {/* Best Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.bestScore}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-3xl font-black text-slate-900">
            {stats.bestScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.dashboard.personalRecord}</p>
        </div>
      </div>

      {/* Recent Quizzes List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">{t.dashboard.recentQuizzes}</h2>
            <p className="text-xs text-slate-500">{t.dashboard.recentSubtitle}</p>
          </div>

          {recentQuizzes.length > 0 && (
            <button
              onClick={onViewAllHistory}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{t.dashboard.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">{t.dashboard.noQuizzesYet}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentQuizzes.slice(0, 5).map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => onSelectQuiz(quiz)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-3 -mx-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">
                      {quiz.bookTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {quiz.date}
                      </span>
                      <span>•</span>
                      <span>{quiz.totalQuestions} {language === 'uz' ? 'ta savol' : 'questions'}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {getDifficultyLabel(quiz.difficulty)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="font-heading font-bold text-sm text-slate-900 block">
                      {quiz.correctAnswers}/{quiz.totalQuestions} ({quiz.scorePercentage}%)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {getScoreLabel(quiz.scorePercentage, language)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
