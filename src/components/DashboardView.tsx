import React, { useState, useEffect } from 'react';
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
  Sparkles,
  HardDrive,
  Eye,
  Zap,
} from 'lucide-react';
import { QuizResultRecord, StudentDashboardStats, LibraryBook } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getScoreLabel } from '../utils/storage';
import { fetchLibraryBooks } from '../utils/apiClient';
import { formatFileSize } from '../utils/pdfExtractor';

interface DashboardViewProps {
  stats: StudentDashboardStats;
  recentQuizzes: QuizResultRecord[];
  onSelectQuiz: (quiz: QuizResultRecord) => void;
  onNewQuiz: () => void;
  onViewAllHistory: () => void;
  onReadBook?: (book: LibraryBook) => void;
  onTakeQuiz?: (book: LibraryBook) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentQuizzes,
  onSelectQuiz,
  onNewQuiz,
  onViewAllHistory,
  onReadBook,
  onTakeQuiz,
}) => {
  const { t, language } = useLanguage();
  const [readingBooks, setReadingBooks] = useState<LibraryBook[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  useEffect(() => {
    setIsLoadingBooks(true);
    fetchLibraryBooks({ limit: 4 })
      .then((res) => {
        if (res && res.books) {
          setReadingBooks(res.books);
        }
      })
      .catch((err) => console.warn('Could not load books for student dashboard:', err))
      .finally(() => setIsLoadingBooks(false));
  }, []);

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
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.dashboard.uploadNewBook}</span>
        </button>
      </div>

      {/* 500 MB Book Capacity Feature Card */}
      <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'uz' ? "500 MB gacha katta kitoblar yuklamasi" : "Up to 500 MB Book Capacity"}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-1">
              {language === 'uz'
                ? "Katta hajmdagi darslik va kitoblarni o'qish hamda test topshirish"
                : "Read & take quizzes from large textbooks and books"}
            </h3>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              {language === 'uz'
                ? "Talabalar 500 MB gacha bo'lgan yirik PDF kitoblar, ensiklopediyalar va darsliklarni qulay o'qishlari hamda ular bo'yicha sun'iy intellekt testlarini topshirishlari mumkin."
                : "Students can now upload and read large PDF textbooks, encyclopedias, and books up to 500 MB with instant AI quiz generation."}
            </p>
          </div>
          <button
            onClick={onNewQuiz}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'uz' ? "Kitob yuklash (500 MB)" : "Upload Book (500 MB)"}</span>
          </button>
        </div>
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

      {/* Student Book Reading Section (500 MB Capacity) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="font-heading text-lg font-bold text-slate-900">
                {language === 'uz' ? "Talaba mutolaa zali & Kitob o'qish" : "Student Reading Hall & Books"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                500 MB gacha
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'uz'
                ? "Talabalar 500 MB gacha bo'lgan kitob va darsliklarni to'g'ridan-to'g'ri o'qishlari hamda ular bo'yicha sun'iy intellekt testlarini topshirishlari mumkin."
                : "Students can read books and textbooks up to 500 MB directly or take instant AI quizzes."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewQuiz}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'uz' ? "Yangi kitob yuklash (500 MB)" : "Upload 500 MB Book"}</span>
            </button>
          </div>
        </div>

        {isLoadingBooks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 rounded-xl p-4 h-36 border border-slate-100" />
            ))}
          </div>
        ) : readingBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {readingBooks.map((book) => (
              <div
                key={book.id}
                className="bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between transition-all hover:shadow-sm hover:border-blue-300 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-md text-slate-600 truncate max-w-[120px]">
                      {book.genre}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-medium">
                      {formatFileSize(book.fileSize)}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">
                    {book.author}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                  {onReadBook && (
                    <button
                      onClick={() => onReadBook(book)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-semibold border border-slate-200 transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-blue-500 group-hover:text-white" />
                      <span>{t.library.readBook}</span>
                    </button>
                  )}
                  {onTakeQuiz && (
                    <button
                      onClick={() => onTakeQuiz(book)}
                      className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title={t.library.takeQuiz}
                    >
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span>Test</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            {language === 'uz' ? "Kutubxonada kitoblar mavjud emas." : "No books available."}
          </div>
        )}
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
