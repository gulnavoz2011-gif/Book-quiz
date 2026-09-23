import React, { useEffect, useState } from 'react';
import { Sparkles, BookOpen, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { UploadedBook, QuizSettingsConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AnalysisLoadingProps {
  book: UploadedBook;
  config: QuizSettingsConfig;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({
  book,
  config,
  error,
  onRetry,
  onCancel,
}) => {
  const { t, language } = useLanguage();
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const stages = [
    { id: 1, text: t.loading.stage1Title, desc: t.loading.stage1Desc },
    { id: 2, text: t.loading.stage2Title, desc: t.loading.stage2Desc },
    { id: 3, text: t.loading.stage3Title, desc: t.loading.stage3Desc },
  ];

  useEffect(() => {
    if (error) return;

    // Transition smoothly through the three requested loading states
    const timer1 = setTimeout(() => {
      setCurrentStageIdx(1);
    }, 2800);

    const timer2 = setTimeout(() => {
      setCurrentStageIdx(2);
    }, 6200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [error]);

  const difficultyText = () => {
    if (config.difficulty === 'easy') return t.config.difficultyEasy;
    if (config.difficulty === 'hard') return t.config.difficultyHard;
    if (config.difficulty === 'mixed') return t.config.difficultyMixed;
    return t.config.difficultyMedium;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
      {!error ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          {/* Animated Spinner Icon */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="w-9 h-9 animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
          </div>

          {/* Current Stage Headline */}
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-2 transition-all duration-300">
            {stages[currentStageIdx]?.text}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
            {stages[currentStageIdx]?.desc}
          </p>

          {/* 3 Step Sequence Indicators */}
          <div className="space-y-3 max-w-md mx-auto mb-8 text-left">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isCurrent
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900 shadow-2xs'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold block">{stage.text}</span>
                  </div>
                  {isPast && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {language === 'uz' ? 'Tayyor' : 'Done'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Book Details Summary */}
          <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
            <span>{language === 'uz' ? 'Kitob' : 'Book'}: <strong className="text-slate-700">{book.fileName}</strong></span>
            <span>•</span>
            <span>{t.config.questionCount}: <strong className="text-slate-700">{config.numberOfQuestions} {language === 'uz' ? 'ta' : ''}</strong></span>
            <span>•</span>
            <span>{t.config.difficulty}: <strong className="text-slate-700 capitalize">{difficultyText()}</strong></span>
          </div>
        </div>
      ) : (
        /* Friendly Error State */
        <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 shadow-sm text-left">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
            {language === 'uz' ? 'Test yaratishda xatolik yuz berdi' : 'Error Generating Quiz'}
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-retry-generation"
              onClick={onRetry}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'uz' ? 'Qayta urinish' : 'Try Again'}
            </button>
            <button
              id="btn-cancel-generation"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              {language === 'uz' ? "Sozlamalarni o'zgartirish" : 'Change Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
