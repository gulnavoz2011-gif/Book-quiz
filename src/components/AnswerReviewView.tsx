import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Quote,
  Sparkles,
  RotateCcw,
  History,
} from 'lucide-react';
import { QuizResultRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AnswerReviewViewProps {
  result: QuizResultRecord;
  onBackToResults: () => void;
  onRetakeQuiz: () => void;
  onViewHistory: () => void;
}

type FilterStatus = 'all' | 'incorrect' | 'correct';

export const AnswerReviewView: React.FC<AnswerReviewViewProps> = ({
  result,
  onBackToResults,
  onRetakeQuiz,
  onViewHistory,
}) => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredQuestions = result.questions.filter((q) => {
    if (filter === 'incorrect') return q.isCorrect === false;
    if (filter === 'correct') return q.isCorrect === true;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            id="btn-back-to-results"
            onClick={onBackToResults}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.review.backToSummary}
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
            {t.review.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.review.book}: <span className="font-medium text-slate-800">{result.bookTitle}</span> • {t.review.result}: {result.scorePercentage}% ({result.correctAnswers}/{result.totalQuestions})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-review-retake"
            onClick={onRetakeQuiz}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.review.retake}
          </button>
          <button
            id="btn-review-my-quizzes"
            onClick={onViewHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {t.review.myQuizzes}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          id="filter-all-questions"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.review.filterAll} ({result.questions.length})
        </button>

        <button
          id="filter-incorrect-questions"
          onClick={() => setFilter('incorrect')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'incorrect'
              ? 'bg-rose-600 text-white'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          {t.review.filterIncorrect} ({result.incorrectAnswers})
        </button>

        <button
          id="filter-correct-questions"
          onClick={() => setFilter('correct')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'correct'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.review.filterCorrect} ({result.correctAnswers})
        </button>
      </div>

      {/* Question Cards List */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            {t.review.noQuestionsFound}
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect === true;
            const isSkipped = !q.userAnswer || q.userAnswer.trim().length === 0;

            return (
              <div
                key={q.id}
                id={`review-question-${idx + 1}`}
                className={`bg-white rounded-2xl border p-6 sm:p-7 shadow-xs transition-all ${
                  isCorrect
                    ? 'border-emerald-200'
                    : isSkipped
                    ? 'border-slate-200'
                    : 'border-rose-200'
                }`}
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-slate-900">
                      {language === 'uz'
                        ? `${result.questions.findIndex((orig) => orig.id === q.id) + 1}-savol`
                        : `Question ${result.questions.findIndex((orig) => orig.id === q.id) + 1}`}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {q.type === 'multiple_choice'
                        ? t.quiz.typeMC
                        : q.type === 'true_false'
                        ? t.quiz.typeTF
                        : t.quiz.typeSA}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-500 capitalize">
                      {q.difficulty === 'easy'
                        ? t.config.difficultyEasy
                        : q.difficulty === 'hard'
                        ? t.config.difficultyHard
                        : t.config.difficultyMedium}
                    </span>
                  </div>

                  {/* Result Pill */}
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.review.correct}
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t.review.unanswered}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      {t.review.incorrect}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 leading-snug mb-5">
                  {q.question}
                </h3>

                {/* Answers Comparison Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs sm:text-sm">
                  {/* User Answer */}
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isSkipped
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {t.review.yourAnswer}
                    </span>
                    <p
                      className={`font-semibold ${
                        isCorrect
                          ? 'text-emerald-950'
                          : isSkipped
                          ? 'text-slate-400 italic'
                          : 'text-rose-950 line-through'
                      }`}
                    >
                      {q.userAnswer && q.userAnswer.trim().length > 0
                        ? q.userAnswer
                        : t.review.notAnswered}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  <div className="p-3.5 rounded-xl border bg-blue-50/50 border-blue-200">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                      {t.review.correctAnswerBook}
                    </span>
                    <p className="font-semibold text-blue-950">{q.correctAnswer}</p>
                  </div>
                </div>

                {/* Semantic Feedback for Short Answer */}
                {q.type === 'short_answer' && q.semanticFeedback && (
                  <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-slate-900">{t.review.semanticFeedback} </strong>
                      <span>{q.semanticFeedback}</span>
                    </div>
                  </div>
                )}

                {/* Book-Based Explanation */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.review.bookExplanation}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {q.explanation}
                  </p>

                  {/* Book Excerpt Citation */}
                  {q.sourceContext && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2 text-xs text-slate-500">
                      <Quote className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="italic text-slate-600">
                        "{q.sourceContext}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky-like Action Bar */}
      <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onBackToResults}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.review.backToSummary}
        </button>

        <button
          onClick={onViewHistory}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>{t.review.allHistory}</span>
        </button>
      </div>
    </div>
  );
};
