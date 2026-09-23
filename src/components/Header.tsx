import React from 'react';
import {
  BookOpen,
  History,
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  Shield,
  Library,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { ActiveAppView, QuizProgressState } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: ActiveAppView;
  onNavigate: (view: ActiveAppView) => void;
  savedQuizCount: number;
  quizProgress?: QuizProgressState;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  savedQuizCount,
  quizProgress,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, isAdmin, logout, setAuthModalOpen } = useAuth();

  const isQuizActive = currentView === 'quiz_active' && !!quizProgress && quizProgress.totalQuestions > 0;
  const currentQNum = quizProgress ? quizProgress.currentIndex + 1 : 0;
  const totalQ = quizProgress ? quizProgress.totalQuestions : 0;
  const answeredQ = quizProgress ? quizProgress.answeredCount : 0;
  const remainingQ = Math.max(0, totalQ - answeredQ);
  const positionPercent = totalQ > 0 ? Math.round((currentQNum / totalQ) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div
            id="nav-logo-button"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate('home')}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group focus:outline-none flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors">
              <BookOpen className="w-5 h-5 transition-transform group-hover:scale-105" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
                  BookQuiz
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  AI
                </span>
                <span
                  id="header-author-badge"
                  className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md ml-1"
                  title={language === 'uz' ? "Mualliflik huquqi: Mirzajonova Gulnavoz" : "Author: Mirzajonova Gulnavoz"}
                >
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>{language === 'uz' ? 'Yaratgan: Mirzajonova Gulnavoz' : 'By Mirzajonova Gulnavoz'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">{t.nav.tagline}</p>
            </div>
          </div>

          {/* Active Quiz Progress Bar & Questions Left in Header */}
          {isQuizActive && (
            <div
              id="header-quiz-progress-widget"
              className="flex items-center gap-2 sm:gap-3 bg-slate-50/90 border border-slate-200 px-3 sm:px-4 py-1.5 rounded-xl shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                  {language === 'uz'
                    ? `${currentQNum} / ${totalQ}-savol`
                    : `Question ${currentQNum} of ${totalQ}`}
                </span>

                {/* Visual Progress Bar Track */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-20 sm:w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      id="header-mini-progress-bar"
                      className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${positionPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                    {positionPercent}%
                  </span>
                </div>
              </div>

              <span className="text-slate-300 hidden sm:inline">•</span>

              {/* Questions left counter */}
              <div className="flex items-center">
                {remainingQ > 0 ? (
                  <span
                    id="header-questions-left-badge"
                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 sm:px-2.5 py-0.5 rounded-lg whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>
                      {language === 'uz'
                        ? `${remainingQ} ${t.quiz.questionsLeft}`
                        : `${remainingQ} ${remainingQ === 1 ? 'question left' : t.quiz.questionsLeft}`}
                    </span>
                  </span>
                ) : (
                  <span
                    id="header-all-questions-answered-badge"
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-0.5 rounded-lg whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.quiz.allAnswered}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links, Auth & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <nav className="flex items-center gap-1">
              <button
                id="nav-new-quiz-btn"
                onClick={() => onNavigate('home')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'home' || currentView === 'quiz_settings'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">{t.nav.newQuiz}</span>
              </button>

              {/* Library (Kutubxona) */}
              <button
                id="nav-library-btn"
                onClick={() => onNavigate('library')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'library' || currentView === 'pdf_reader'
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Library className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">{t.nav.library}</span>
              </button>

              {/* Admin Panel */}
              <button
                id="nav-admin-panel-btn"
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalOpen(true);
                  } else {
                    onNavigate('admin');
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="hidden lg:inline">{t.nav.adminPanel}</span>
                {isAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                )}
              </button>

              <button
                id="nav-my-quizzes-btn"
                onClick={() => onNavigate('my_quizzes')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 relative ${
                  currentView === 'my_quizzes' || currentView === 'answer_review'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden lg:inline">{t.nav.myQuizzes}</span>
                {savedQuizCount > 0 && (
                  <span className="ml-0.5 text-xs px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
                    {savedQuizCount}
                  </span>
                )}
              </button>

              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span className="hidden xl:inline">{t.nav.dashboard}</span>
              </button>
            </nav>

            {/* Auth Profile / Login Button */}
            <div className="flex items-center pl-1 border-l border-slate-200">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold uppercase">
                      {user.role === 'admin' ? 'Admin' : 'Kitobxon'}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    title={t.nav.logout}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.nav.login}</span>
                </button>
              )}
            </div>

            {/* Language Settings Switcher */}
            <div
              id="language-selector"
              className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs"
            >
              <button
                id="lang-btn-uz"
                type="button"
                onClick={() => setLanguage('uz')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  language === 'uz'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title="O'zbek tili"
              >
                <span className="text-[11px]">🇺🇿</span>
                <span>UZ</span>
              </button>
              <button
                id="lang-btn-en"
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  language === 'en'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title="English language"
              >
                <span className="text-[11px]">🇬🇧</span>
                <span>EN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width sticky progress bar at bottom of Header */}
      {isQuizActive && (
        <div
          id="header-quiz-full-progress-bar"
          className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden"
        >
          <div
            id="header-quiz-progress-bar-fill"
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(3, positionPercent)}%` }}
          />
        </div>
      )}
    </header>
  );
};
