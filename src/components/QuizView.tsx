import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  HelpCircle,
  X,
} from 'lucide-react';
import { QuizQuestion, UploadedBook, QuizProgressState } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuizViewProps {
  book: UploadedBook;
  questions: QuizQuestion[];
  onSubmit: (userAnswers: Record<string, string>) => void;
  onExit: () => void;
  onProgressChange?: (progress: QuizProgressState) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  book,
  questions,
  onSubmit,
  onExit,
  onProgressChange,
}) => {
  const { t, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [unansweredIndices, setUnansweredIndices] = useState<number[]>([]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = answers[currentQuestion.id] || '';

  // Progress percentage
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange({
        currentIndex,
        totalQuestions,
        answeredCount,
      });
    }
  }, [currentIndex, answeredCount, totalQuestions, onProgressChange]);

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: e.target.value,
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const checkValidation = () => {
    const unanswered: number[] = [];
    questions.forEach((q, idx) => {
      const val = answers[q.id];
      if (!val || val.trim().length === 0) {
        unanswered.push(idx);
      }
    });

    if (unanswered.length > 0) {
      setUnansweredIndices(unanswered);
      setShowValidationModal(true);
    } else {
      onSubmit(answers);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setShowValidationModal(false);
  };

  const handleConfirmSubmitAnyway = () => {
    setShowValidationModal(false);
    onSubmit(answers);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar: Book title, Question count, and Question selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-sm sm:text-base text-slate-900 truncate">
                {book.fileName.replace(/\.pdf$/i, '')}
              </h1>
              <p className="text-xs text-slate-500">
                {language === 'uz'
                  ? `${currentIndex + 1}-savol / ${totalQuestions} • ${answeredCount} ta belgilandi`
                  : `Question ${currentIndex + 1} of ${totalQuestions} • ${answeredCount} answered`}
              </p>
            </div>
          </div>

          <button
            id="btn-exit-quiz"
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            {t.quiz.exitQuiz}
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Selector Dots / Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] && answers[q.id].trim().length > 0;

            return (
              <button
                key={q.id}
                id={`quiz-jump-btn-${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center flex-shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                    : isAnswered
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
                title={
                  language === 'uz'
                    ? `${idx + 1}-savol (${isAnswered ? 'Javob berilgan' : 'Javob berilmagan'})`
                    : `Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`
                }
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm mb-6 transition-all">
        {/* Question Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {currentQuestion.type === 'multiple_choice'
                ? t.quiz.typeMC
                : currentQuestion.type === 'true_false'
                ? t.quiz.typeTF
                : t.quiz.typeSA}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
              {currentQuestion.difficulty === 'easy'
                ? t.config.difficultyEasy
                : currentQuestion.difficulty === 'hard'
                ? t.config.difficultyHard
                : t.config.difficultyMedium}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-8">
          {currentQuestion.question}
        </h2>

        {/* Answer Options Area */}
        <div className="space-y-3 mb-8">
          {/* 1. Multiple Choice */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = currentAnswer === option;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <div
                    key={optIdx}
                    id={`option-${currentQuestion.id}-${optIdx}`}
                    onClick={() => handleSelectOption(option)}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all min-h-[52px] ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className={`text-sm leading-relaxed flex-1 ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. True / False */}
          {currentQuestion.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {(currentQuestion.options && currentQuestion.options.length === 2
                ? currentQuestion.options
                : ['True', 'False']
              ).map((tfValue) => {
                const isSelected = currentAnswer.toLowerCase() === tfValue.toLowerCase();
                const isTrueLike = tfValue.toLowerCase() === 'true' || tfValue.toLowerCase() === 'rost';
                const displayLabel = isTrueLike ? t.quiz.tfTrue : t.quiz.tfFalse;

                return (
                  <button
                    key={tfValue}
                    type="button"
                    id={`btn-tf-${currentQuestion.id}-${tfValue.toLowerCase()}`}
                    onClick={() => handleSelectOption(tfValue)}
                    className={`py-6 rounded-xl border text-base font-bold transition-all flex flex-col items-center justify-center gap-2 min-h-[72px] ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-2'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{displayLabel}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Short Answer */}
          {currentQuestion.type === 'short_answer' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                {t.quiz.yourAnswer}
              </label>
              <textarea
                id={`input-short-answer-${currentQuestion.id}`}
                rows={3}
                value={currentAnswer}
                onChange={handleTextAnswerChange}
                placeholder={t.quiz.placeholderShort}
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 resize-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            id="btn-quiz-prev"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.quiz.previous}</span>
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < totalQuestions - 1 ? (
              <button
                id="btn-quiz-next"
                onClick={handleNext}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <span>{t.quiz.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-quiz-submit"
                onClick={checkValidation}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm min-h-[44px]"
              >
                <span>{t.quiz.submitQuiz}</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unanswered Questions Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
              {t.quiz.unansweredModalTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {language === 'uz'
                ? `Siz ${totalQuestions} ta savoldan ${unansweredIndices.length} tasini belgilanmagan qoldirdingiz. Quyidagi tugmalar orqali o'sha savolga qaytishingiz yoki testni shundayligicha topshirishingiz mumkin.`
                : `You left ${unansweredIndices.length} of ${totalQuestions} questions unanswered. You can return to them or submit anyway.`}
            </p>

            {/* List of unanswered question badges */}
            <div className="mb-6 flex flex-wrap gap-2">
              {unansweredIndices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleJumpToQuestion(idx)}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors"
                >
                  {language === 'uz' ? `${idx + 1}-savol` : `Question ${idx + 1}`}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                id="btn-return-to-unanswered"
                onClick={() => handleJumpToQuestion(unansweredIndices[0])}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                {language === 'uz'
                  ? `${unansweredIndices[0] + 1}-savolni ko'rish`
                  : `View Question ${unansweredIndices[0] + 1}`}
              </button>
              <button
                id="btn-confirm-submit-anyway"
                onClick={handleConfirmSubmitAnyway}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                {t.quiz.submitAnyway}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
