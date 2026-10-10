import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  GraduationCap,
  Key,
  Sparkles,
  Activity,
  Eye,
  Check,
  Save,
  Clock,
  RotateCcw,
  BarChart2,
  TrendingUp,
  Percent,
  Layers,
  Info,
} from 'lucide-react';
import {
  QuizQuestion,
  UploadedBook,
  QuizProgressState,
  ProvisionalQuizStats,
  QuizSettingsConfig,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  calculateProvisionalQuizStats,
  saveActiveQuizSession,
  loadActiveQuizSession,
  clearActiveQuizSession,
} from '../utils/quizTracking';

interface QuizViewProps {
  book: UploadedBook;
  questions: QuizQuestion[];
  config?: QuizSettingsConfig;
  initialAnswers?: Record<string, string>;
  initialIndex?: number;
  initialTabSwitches?: number;
  startTime?: number;
  onSubmit: (userAnswers: Record<string, string>, studentName?: string) => void;
  onExit: () => void;
  onProgressChange?: (progress: QuizProgressState) => void;
  onProvisionalSave?: (stats: ProvisionalQuizStats, answers: Record<string, string>) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  book,
  questions,
  config,
  initialAnswers,
  initialIndex,
  initialTabSwitches,
  startTime,
  onSubmit,
  onExit,
  onProgressChange,
  onProvisionalSave,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // 1. Restore answers from props or active session (preserve progress)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return initialAnswers;
    }
    const saved = loadActiveQuizSession();
    if (saved && saved.book?.id === book.id && saved.answers) {
      return saved.answers;
    }
    return {};
  });

  // 2. Restore current index
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialIndex !== undefined) {
      return Math.min(Math.max(0, initialIndex), Math.max(0, questions.length - 1));
    }
    const saved = loadActiveQuizSession();
    if (saved && saved.book?.id === book.id && typeof saved.currentIndex === 'number') {
      return Math.min(Math.max(0, saved.currentIndex), Math.max(0, questions.length - 1));
    }
    return 0;
  });

  // 3. Tab switch counter
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(() => {
    if (initialTabSwitches !== undefined) return initialTabSwitches;
    const saved = loadActiveQuizSession();
    if (saved && saved.book?.id === book.id && typeof saved.tabSwitchCount === 'number') {
      return saved.tabSwitchCount;
    }
    return 0;
  });

  // 4. Session Start Time
  const [quizStartTime] = useState<number>(() => {
    if (startTime) return startTime;
    const saved = loadActiveQuizSession();
    if (saved && saved.book?.id === book.id && saved.startTime) {
      return saved.startTime;
    }
    return Date.now();
  });

  // 5. Provisional Real-Time Stats (strictly calculated according to formula)
  const [provisionalStats, setProvisionalStats] = useState<ProvisionalQuizStats>(() =>
    calculateProvisionalQuizStats(questions, answers, tabSwitchCount, 'initialized')
  );

  // Status and visibility UI states
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>(() =>
    new Date().toLocaleTimeString()
  );
  const [tabSwitchAlert, setTabSwitchAlert] = useState<{
    message: string;
    type: 'switch' | 'return' | 'blur';
    timestamp: string;
  } | null>(null);

  const [showProvisionalModal, setShowProvisionalModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showStudentSubmitModal, setShowStudentSubmitModal] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState(() => user?.name || '');
  const [unansweredIndices, setUnansweredIndices] = useState<number[]>([]);

  // Ref to hold current state for event listeners without stale closures
  const stateRef = useRef({
    answers,
    currentIndex,
    tabSwitchCount,
  });

  useEffect(() => {
    stateRef.current = { answers, currentIndex, tabSwitchCount };
  }, [answers, currentIndex, tabSwitchCount]);

  useEffect(() => {
    if (user?.name && !studentNameInput) {
      setStudentNameInput(user.name);
    }
  }, [user]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const progressPercent =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  // Persist session to localStorage and trigger handlers
  const persistSession = useCallback(
    (
      currentAnswers: Record<string, string>,
      switches: number,
      currentIdx: number,
      reason: string
    ) => {
      const stats = calculateProvisionalQuizStats(questions, currentAnswers, switches, reason);
      setProvisionalStats(stats);
      setLastAutoSaveTime(new Date().toLocaleTimeString());

      const activeSession = {
        book,
        questions,
        config,
        currentIndex: currentIdx,
        answers: currentAnswers,
        tabSwitchCount: switches,
        startTime: quizStartTime,
        lastActiveTime: Date.now(),
        stats,
        isProvisional: true,
      };

      saveActiveQuizSession(activeSession);

      if (onProgressChange) {
        onProgressChange({
          currentIndex: currentIdx,
          totalQuestions: questions.length,
          answeredCount: stats.answeredQuestions,
          provisionalStats: stats,
        });
      }

      if (onProvisionalSave) {
        onProvisionalSave(stats, currentAnswers);
      }
    },
    [book, questions, config, quizStartTime, onProgressChange, onProvisionalSave]
  );

  // Recalculate stats whenever answers change
  useEffect(() => {
    const stats = calculateProvisionalQuizStats(
      questions,
      answers,
      tabSwitchCount,
      'answer_updated'
    );
    setProvisionalStats(stats);
  }, [answers, questions, tabSwitchCount]);

  // Page Visibility API & Window event listeners
  useEffect(() => {
    // 1. Page Visibility API: Detect tab switching, minimizing window, or switching apps
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden or browser minimized
        setIsTabHidden(true);
        const nextSwitches = stateRef.current.tabSwitchCount + 1;
        setTabSwitchCount(nextSwitches);

        persistSession(
          stateRef.current.answers,
          nextSwitches,
          stateRef.current.currentIndex,
          'tab_switch_hidden'
        );

        setTabSwitchAlert({
          message:
            language === 'uz'
              ? "Boshqa tab yoki oynaga o'tildi. Page Visibility API orqali oraliq natijalar avtomatik saqlandi."
              : 'Switched to another tab/window. Provisional results saved automatically via Page Visibility API.',
          type: 'switch',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        // Tab became visible again (user returned to quiz page)
        setIsTabHidden(false);
        persistSession(
          stateRef.current.answers,
          stateRef.current.tabSwitchCount,
          stateRef.current.currentIndex,
          'tab_switch_returned'
        );

        setTabSwitchAlert({
          message:
            language === 'uz'
              ? "Test sahifasiga qaytildi. Barcha javoblar tiklandi va oraliq natijalar avtomatik yangilandi."
              : 'Returned to the quiz. All previous answers restored and provisional results updated.',
          type: 'return',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    };

    // 2. Window Blur: Detect clicking away from browser or switching to external applications
    const handleWindowBlur = () => {
      persistSession(
        stateRef.current.answers,
        stateRef.current.tabSwitchCount,
        stateRef.current.currentIndex,
        'window_blur'
      );
    };

    // 3. Window Focus: Detect returning focus to the browser window
    const handleWindowFocus = () => {
      persistSession(
        stateRef.current.answers,
        stateRef.current.tabSwitchCount,
        stateRef.current.currentIndex,
        'window_focus'
      );
    };

    // 4. Before Unload: Detect page refresh or leaving the website
    const handleBeforeUnload = () => {
      persistSession(
        stateRef.current.answers,
        stateRef.current.tabSwitchCount,
        stateRef.current.currentIndex,
        'before_unload'
      );
    };

    // 5. Page Hide: Detect mobile tab switch or page navigation
    const handlePageHide = () => {
      persistSession(
        stateRef.current.answers,
        stateRef.current.tabSwitchCount,
        stateRef.current.currentIndex,
        'page_hide'
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [persistSession, language]);

  // Answer option selection
  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: option,
    };
    setAnswers(nextAnswers);
    persistSession(nextAnswers, tabSwitchCount, currentIndex, 'option_selected');
  };

  // Text answer edit
  const handleTextAnswerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!currentQuestion) return;
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: e.target.value,
    };
    setAnswers(nextAnswers);
    persistSession(nextAnswers, tabSwitchCount, currentIndex, 'text_changed');
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      persistSession(answers, tabSwitchCount, nextIdx, 'navigate_prev');
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistSession(answers, tabSwitchCount, nextIdx, 'navigate_next');
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setShowValidationModal(false);
    persistSession(answers, tabSwitchCount, idx, 'jump_question');
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
      setShowStudentSubmitModal(true);
    }
  };

  const handleConfirmSubmitAnyway = () => {
    setShowValidationModal(false);
    setShowStudentSubmitModal(true);
  };

  const handleFinalSubmit = () => {
    const finalName = studentNameInput.trim() || user?.name || 'Talaba';
    setShowStudentSubmitModal(false);
    clearActiveQuizSession();
    onSubmit(answers, finalName);
  };

  const handleSafeExit = () => {
    persistSession(answers, tabSwitchCount, currentIndex, 'user_exit');
    onExit();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* 1. Real-Time Quiz Tracking & Results Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl mb-6 border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-wide">
                  {language === 'uz' ? 'Jonli monitoring va natijalar' : 'Live Tracking & Real-Time Results'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {isTabHidden
                    ? language === 'uz' ? 'Tab yopiq' : 'Tab Hidden'
                    : language === 'uz' ? 'Faol rejim' : 'Active'}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Page Visibility API
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">
                {book.fileName.replace(/\.pdf$/i, '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-view-provisional-details"
              onClick={() => setShowProvisionalModal(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-300" />
              <span>{language === 'uz' ? "Batafsil natijalar" : 'Full Breakdown'}</span>
            </button>

            <button
              type="button"
              id="btn-exit-quiz-safe"
              onClick={handleSafeExit}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {t.quiz.exitQuiz}
            </button>
          </div>
        </div>

        {/* 7 Core Live Metric Formula Cards (Directly matching user specs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 pt-4">
          {/* 1. Total questions */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {language === 'uz' ? 'Jami savollar' : 'Total'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-white">
                {provisionalStats.totalQuestions}
              </span>
              <span className="text-[11px] text-slate-400">ta</span>
            </div>
          </div>

          {/* 2. Answered so far */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
              {language === 'uz' ? 'Javob berilgan' : 'Answered'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-blue-400">
                {provisionalStats.answeredQuestions}
              </span>
              <span className="text-[11px] text-slate-400">/ {provisionalStats.totalQuestions}</span>
            </div>
          </div>

          {/* 3. Correct answers */}
          <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'uz' ? "To'g'ri" : 'Correct'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-emerald-400">
                {provisionalStats.correctAnswers}
              </span>
              <span className="text-[11px] text-emerald-300/70">ta</span>
            </div>
          </div>

          {/* 4. Incorrect answers */}
          <div className="bg-rose-950/40 rounded-2xl p-3 border border-rose-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {language === 'uz' ? "Noto'g'ri" : 'Incorrect'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-rose-400">
                {provisionalStats.incorrectAnswers}
              </span>
              <span className="text-[11px] text-rose-300/70">ta</span>
            </div>
          </div>

          {/* 5. Unanswered questions */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {language === 'uz' ? 'Qolgan' : 'Unanswered'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-slate-300">
                {provisionalStats.unansweredQuestions}
              </span>
              <span className="text-[11px] text-slate-400">ta</span>
            </div>
          </div>

          {/* 6. Completion percentage */}
          <div className="bg-blue-950/40 rounded-2xl p-3 border border-blue-500/30 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
              {language === 'uz' ? 'Tugatish' : 'Completion'}
            </span>
            <div className="mt-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-blue-300">
                {provisionalStats.completionPercentage}%
              </span>
              <div className="w-full bg-slate-700/70 rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${provisionalStats.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7. Accuracy percentage */}
          <div className="bg-indigo-950/40 rounded-2xl p-3 border border-indigo-500/30 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
              {language === 'uz' ? 'Aniqlik' : 'Accuracy'}
            </span>
            <div className="mt-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-indigo-300">
                {provisionalStats.accuracyPercentage}%
              </span>
              <div className="w-full bg-slate-700/70 rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${provisionalStats.accuracyPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status footer with Tab Switch count and auto-save assurance */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {language === 'uz'
                  ? `Tab almashtirishlar: ${tabSwitchCount} marta`
                  : `Tab switches detected: ${tabSwitchCount}`}
              </span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {language === 'uz'
                  ? `Avtomatik saqlangan: ${lastAutoSaveTime}`
                  : `Auto-saved at: ${lastAutoSaveTime}`}
              </span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span>
              {language === 'uz'
                ? "Test yakunlanmaguncha javob berilmagan savollar xato sanalmaydi"
                : 'Unanswered questions are not marked incorrect until final submission'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Notification banner when returning or switching tabs */}
      {tabSwitchAlert && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in transition-all ${
            tabSwitchAlert.type === 'return'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {tabSwitchAlert.type === 'return' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-semibold leading-snug">
                {tabSwitchAlert.message}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {language === 'uz'
                  ? `Qayd etilgan vaqt: ${tabSwitchAlert.timestamp} • Tab almashishlar: ${tabSwitchCount}`
                  : `Timestamp: ${tabSwitchAlert.timestamp} • Total switches: ${tabSwitchCount}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTabSwitchAlert(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Question Selector Dots and Visual Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-xs font-bold text-slate-700">
            {language === 'uz'
              ? `${currentIndex + 1}-savol / ${totalQuestions}`
              : `Question ${currentIndex + 1} of ${totalQuestions}`}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {language === 'uz'
              ? `${provisionalStats.answeredQuestions} ta belgilandi (${provisionalStats.completionPercentage}%)`
              : `${provisionalStats.answeredQuestions} answered (${provisionalStats.completionPercentage}%)`}
          </span>
        </div>

        {/* Progress bar */}
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
                type="button"
                onClick={() => handleJumpToQuestion(idx)}
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

      {/* 4. Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm mb-6 transition-all">
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
                      className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all min-h-[56px] ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {letter}
                      </div>
                      <span
                        className={`text-sm leading-relaxed flex-1 ${
                          isSelected ? 'font-bold text-slate-900' : 'text-slate-800'
                        }`}
                      >
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
                  const isTrueLike =
                    tfValue.toLowerCase() === 'true' || tfValue.toLowerCase() === 'rost';
                  const displayLabel = isTrueLike ? t.quiz.tfTrue : t.quiz.tfFalse;

                  return (
                    <button
                      key={tfValue}
                      type="button"
                      id={`btn-tf-${currentQuestion.id}-${tfValue.toLowerCase()}`}
                      onClick={() => handleSelectOption(tfValue)}
                      className={`py-6 rounded-2xl border text-base font-bold transition-all flex flex-col items-center justify-center gap-2 min-h-[76px] ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
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
                  className="w-full p-4 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 resize-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              id="btn-quiz-prev"
              type="button"
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
                  type="button"
                  onClick={handleNext}
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <span>{t.quiz.next}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-quiz-submit"
                  type="button"
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
      )}

      {/* 5. Detailed Provisional Results Summary Modal */}
      {showProvisionalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                <BarChart2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowProvisionalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
              {language === 'uz' ? 'Oraliq natijalar xulosasi' : 'Provisional Results Summary'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {language === 'uz'
                ? "Foydalanuvchi boshqa oynaga o'tganda yoki sahifani tark etganda hisoblangan jonli oraliq natijalar"
                : 'Live provisional results calculated whenever tab changes or user leaves the page'}
            </p>

            {/* Formula Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? 'Jami savollar' : 'Total Questions'}
                </span>
                <span className="font-heading text-2xl font-black text-slate-900">
                  {provisionalStats.totalQuestions}
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? 'Javob berilgan' : 'Answered'}
                </span>
                <span className="font-heading text-2xl font-black text-blue-900">
                  {provisionalStats.answeredQuestions}
                  <span className="text-xs font-normal text-blue-600 ml-1">/ {provisionalStats.totalQuestions}</span>
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? "To'g'ri javoblar" : 'Correct'}
                </span>
                <span className="font-heading text-2xl font-black text-emerald-800">
                  {provisionalStats.correctAnswers}
                </span>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? "Noto'g'ri javoblar" : 'Incorrect'}
                </span>
                <span className="font-heading text-2xl font-black text-rose-800">
                  {provisionalStats.incorrectAnswers}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? 'Javob berilmagan' : 'Unanswered'}
                </span>
                <span className="font-heading text-2xl font-black text-slate-700">
                  {provisionalStats.unansweredQuestions}
                </span>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block mb-1">
                  {language === 'uz' ? 'Aniqlik darajasi' : 'Accuracy'}
                </span>
                <span className="font-heading text-2xl font-black text-indigo-900">
                  {provisionalStats.accuracyPercentage}%
                </span>
              </div>
            </div>

            {/* Formula Explanation Callout */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-blue-600" />
                <span>{language === 'uz' ? 'Hisoblash formulasi (Live Results Formula):' : 'Calculation Formula:'}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                <li>• Completion = {provisionalStats.answeredQuestions} / {provisionalStats.totalQuestions} × 100 = {provisionalStats.completionPercentage}%</li>
                <li>• Accuracy = {provisionalStats.correctAnswers} / {provisionalStats.answeredQuestions || 1} × 100 = {provisionalStats.accuracyPercentage}%</li>
                <li>• Incorrect = {provisionalStats.answeredQuestions} − {provisionalStats.correctAnswers} = {provisionalStats.incorrectAnswers}</li>
                <li>• Unanswered = {provisionalStats.totalQuestions} − {provisionalStats.answeredQuestions} = {provisionalStats.unansweredQuestions}</li>
              </ul>
              <p className="text-[11px] text-amber-700 pt-1 font-sans">
                {language === 'uz'
                  ? "Eslatma: Testdan chiqilganda javob berilmagan savollar xato deb belgilanmaydi. Oraliq natija sifatida xavfsiz saqlanadi."
                  : 'Note: Unanswered questions are preserved as provisional and not marked incorrect until final submission.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {language === 'uz'
                  ? `Tab almashishlar: ${tabSwitchCount}`
                  : `Tab switches: ${tabSwitchCount}`}
              </span>
              <button
                type="button"
                onClick={() => setShowProvisionalModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                {language === 'uz' ? 'Davom ettirish' : 'Continue Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Unanswered Questions Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
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
                  type="button"
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
                type="button"
                onClick={() => handleJumpToQuestion(unansweredIndices[0])}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                {language === 'uz'
                  ? `${unansweredIndices[0] + 1}-savolni ko'rish`
                  : `View Question ${unansweredIndices[0] + 1}`}
              </button>
              <button
                id="btn-confirm-submit-anyway"
                type="button"
                onClick={handleConfirmSubmitAnyway}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                {t.quiz.submitAnyway}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Student Name Confirmation & Database Persistence Modal */}
      {showStudentSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowStudentSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {language === 'uz' ? 'Test natijasini bazaga saqlash' : 'Save Quiz Result to Database'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {book.fileName.replace(/\.pdf$/i, '')} • {totalQuestions} ta savol
            </p>

            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl mb-4 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'uz' ? 'Talaba nomi = Parol' : 'Student Name = Password'}</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                {language === 'uz'
                  ? "Kiritilgan ism talabaning paroli hisoblanadi. Natijangiz markaziy ma'lumotlar bazasiga saqlanadi va Admin tomonidan ham ko'rinadi."
                  : 'Your name serves as your student password. Quiz attempts are securely saved into the database.'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'uz' ? 'Talaba ismi va familiyasi:' : 'Student Full Name:'}
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  autoFocus
                  required
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder={
                    language === 'uz' ? 'Ism va familiyangizni kiriting...' : 'Enter your full name...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFinalSubmit();
                    }
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'uz'
                  ? "Ushbu ism orqali keyinchalik o'z natijalaringizni tekshirishingiz mumkin."
                  : 'You can track your quizzes using this name anytime.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStudentSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                {language === 'uz' ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-confirm-save-to-db"
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'uz'
                    ? 'Natijani hisoblash va Saqlash'
                    : 'Submit & Save to DB'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
