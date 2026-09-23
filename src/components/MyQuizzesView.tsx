import React, { useState } from 'react';
import {
  History,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Search,
  PlusCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { QuizResultRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MyQuizzesViewProps {
  quizzes: QuizResultRecord[];
  onSelectQuiz: (quiz: QuizResultRecord) => void;
  onRetakeQuiz: (quiz: QuizResultRecord) => void;
  onDeleteQuiz: (quizId: string) => void;
  onNewQuiz: () => void;
}

export const MyQuizzesView: React.FC<MyQuizzesViewProps> = ({
  quizzes,
  onSelectQuiz,
  onRetakeQuiz,
  onDeleteQuiz,
  onNewQuiz,
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuizzes = quizzes.filter((q) =>
    q.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.bookFileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLabelColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (percentage >= 75) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (percentage >= 50) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

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
            <History className="w-5 h-5 text-blue-600" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
              {t.myQuizzes.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.myQuizzes.subtitle}
          </p>
        </div>

        <button
          id="btn-history-new-quiz"
          onClick={onNewQuiz}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.myQuizzes.newQuiz}</span>
        </button>
      </div>

      {/* Search Bar */}
      {quizzes.length > 0 && (
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-quizzes"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.myQuizzes.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>
      )}

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
            {searchTerm ? t.myQuizzes.noQuizzesFound : t.myQuizzes.noQuizzesYet}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {searchTerm
              ? t.myQuizzes.searchTryAnother
              : t.myQuizzes.emptySubtitle}
          </p>
          <button
            onClick={onNewQuiz}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            {t.myQuizzes.uploadBook}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              id={`quiz-card-${quiz.id}`}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {quiz.bookFileName}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {quiz.date}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getLabelColor(
                      quiz.scorePercentage
                    )}`}
                  >
                    {quiz.scorePercentage}%
                  </span>
                </div>

                <h3 className="font-heading text-base font-bold text-slate-900 mb-3 line-clamp-1">
                  {quiz.bookTitle}
                </h3>

                {/* Metrics row */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap">
                  <span className="font-medium text-slate-700">
                    {quiz.totalQuestions} {language === 'uz' ? 'ta savol' : 'questions'}
                  </span>
                  <span>•</span>
                  <span>
                    {t.myQuizzes.score}: <strong className="text-slate-900">{quiz.correctAnswers}/{quiz.totalQuestions}</strong>
                  </span>
                  <span>•</span>
                  <span className="capitalize">
                    {t.myQuizzes.level}: {getDifficultyLabel(quiz.difficulty)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  id={`btn-open-quiz-${quiz.id}`}
                  onClick={() => onSelectQuiz(quiz)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>{t.myQuizzes.openResults}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRetakeQuiz(quiz)}
                    title={t.results.retake}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteQuiz(quiz.id)}
                    title={t.myQuizzes.deleteTooltip}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
