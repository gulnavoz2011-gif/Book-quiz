import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  History,
  FileText,
  Award,
} from 'lucide-react';
import { QuizResultRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getScoreLabel } from '../utils/storage';

interface ResultsViewProps {
  result: QuizResultRecord;
  onReviewAnswers: () => void;
  onRetakeQuiz: () => void;
  onNewQuiz: () => void;
  onViewHistory: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onReviewAnswers,
  onRetakeQuiz,
  onNewQuiz,
  onViewHistory,
}) => {
  const { t, language } = useLanguage();

  useEffect(() => {
    if (result.scorePercentage >= 70) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch (e) {
        // ignore if canvas blocked
      }
    }
  }, [result.scorePercentage]);

  // Score circle calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.scorePercentage / 100) * circumference;

  const currentScoreLabel = getScoreLabel(result.scorePercentage, language);

  const getLabelColor = (label: string) => {
    switch (label) {
      case "A'lo":
      case 'Excellent':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Juda yaxshi':
      case 'Very Good':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Yaxshi':
      case 'Good':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Large Result Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate max-w-md">
            {result.bookTitle}
          </span>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
          {t.results.title}
        </h1>

        {/* Progress Score Circle */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            {/* Progress Stroke */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                result.scorePercentage >= 75
                  ? 'text-blue-600'
                  : result.scorePercentage >= 50
                  ? 'text-amber-500'
                  : 'text-slate-600'
              }`}
            />
          </svg>

          {/* Center score details */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl font-black text-slate-900 tracking-tight">
              {result.scorePercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-0.5">
              {result.correctAnswers} / {result.totalQuestions} {language === 'uz' ? "to'g'ri" : 'correct'}
            </span>
          </div>
        </div>

        {/* Score Category Description Pill */}
        <div className="inline-flex items-center gap-1.5 mb-8">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${getLabelColor(
              currentScoreLabel
            )}`}
          >
            {currentScoreLabel}
          </span>
        </div>

        {/* Detailed Breakdown Grid (All 7 required summary metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-6 border-t border-slate-100 mb-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {language === 'uz' ? 'Jami savollar' : 'Total Questions'}
            </span>
            <span className="font-heading text-xl font-black text-slate-900">
              {result.totalQuestions}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              {language === 'uz' ? 'Javob berilgan' : 'Answered'}
            </span>
            <span className="font-heading text-xl font-black text-blue-900">
              {result.correctAnswers + result.incorrectAnswers}
              <span className="text-xs font-normal text-blue-600"> / {result.totalQuestions}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.results.correct}</span>
            </div>
            <span className="font-heading text-xl font-black text-emerald-950">
              {result.correctAnswers}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-700 mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.results.incorrect}</span>
            </div>
            <span className="font-heading text-xl font-black text-rose-950">
              {result.incorrectAnswers}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.results.skipped}</span>
            </div>
            <span className="font-heading text-xl font-black text-slate-900">
              {result.unansweredQuestions}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              {language === 'uz' ? 'Tugatish foizi' : 'Completion'}
            </span>
            <span className="font-heading text-xl font-black text-blue-900">
              {result.totalQuestions > 0
                ? Math.round(((result.correctAnswers + result.incorrectAnswers) / result.totalQuestions) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
              {language === 'uz' ? 'Aniqlik darajasi' : 'Accuracy'}
            </span>
            <span className="font-heading text-xl font-black text-indigo-900">
              {result.correctAnswers + result.incorrectAnswers > 0
                ? Math.round((result.correctAnswers / (result.correctAnswers + result.incorrectAnswers)) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {language === 'uz' ? 'Tab almashish' : 'Tab Switches'}
            </span>
            <span className="font-heading text-xl font-black text-slate-700">
              {result.tabSwitchCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <button
          id="btn-review-answers"
          onClick={onReviewAnswers}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>{t.results.reviewAnswers}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          id="btn-retake-quiz"
          onClick={onRetakeQuiz}
          className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>{t.results.retake}</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
        <button
          id="btn-nav-to-history"
          onClick={onViewHistory}
          className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          {t.results.history}
        </button>
        <span>•</span>
        <button
          id="btn-upload-another-book"
          onClick={onNewQuiz}
          className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          {t.results.uploadAnother}
        </button>
      </div>
    </div>
  );
};
