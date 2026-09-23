import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { QuizSettingsView } from './components/QuizSettingsView';
import { AnalysisLoading } from './components/AnalysisLoading';
import { QuizView } from './components/QuizView';
import { ResultsView } from './components/ResultsView';
import { AnswerReviewView } from './components/AnswerReviewView';
import { MyQuizzesView } from './components/MyQuizzesView';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { AdminPanelView } from './components/AdminPanelView';
import { PdfReaderView } from './components/PdfReaderView';
import { AuthModal } from './components/AuthModal';

import {
  ActiveAppView,
  UploadedBook,
  QuizSettingsConfig,
  QuizQuestion,
  QuizResultRecord,
  QuizProgressState,
  LibraryBook,
} from './types';
import {
  getSavedQuizzes,
  saveQuizResult,
  deleteQuizResult,
  calculateDashboardStats,
  getScoreLabel,
} from './utils/storage';
import {
  requestBookAnalysis,
  requestGenerateQuiz,
  requestEvaluateShortAnswer,
} from './utils/apiClient';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { language, t } = useLanguage();
  const { authModalOpen, setAuthModalOpen } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<ActiveAppView>('home');

  // Active Session State
  const [activeBook, setActiveBook] = useState<UploadedBook | null>(null);
  const [activeConfig, setActiveConfig] = useState<QuizSettingsConfig | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [activeResult, setActiveResult] = useState<QuizResultRecord | null>(null);
  const [selectedReaderBook, setSelectedReaderBook] = useState<LibraryBook | null>(null);
  const [quizProgress, setQuizProgress] = useState<QuizProgressState>({
    currentIndex: 0,
    totalQuestions: 0,
    answeredCount: 0,
  });

  // Loading & Error States
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isEvaluatingAnswers, setIsEvaluatingAnswers] = useState(false);

  // Persistent History & Dashboard
  const [savedQuizzes, setSavedQuizzes] = useState<QuizResultRecord[]>([]);

  useEffect(() => {
    const loaded = getSavedQuizzes();
    setSavedQuizzes(loaded);
  }, []);

  // 1. When a book is uploaded or sample book selected
  const handleBookReady = (book: UploadedBook) => {
    setActiveBook(book);
    setCurrentView('quiz_settings');
  };

  // 1b. When a user chooses to read a book from the Library or Admin
  const handleReadBook = (book: LibraryBook) => {
    setSelectedReaderBook(book);
    setCurrentView('pdf_reader');
  };

  // 1c. When a user chooses to take a quiz for a Library book
  const handleTakeQuizFromLibrary = (book: LibraryBook) => {
    const uploadedBook: UploadedBook = {
      id: book.id,
      fileName: `${book.title}.pdf`,
      fileSize: book.fileSize || 1024 * 100,
      numPages: book.pagesCount || 10,
      wordCount: Math.round((book.fullText?.length || 2000) / 6),
      charCount: book.fullText?.length || 2000,
      fullText:
        book.fullText ||
        `${book.title} - ${book.author}.\nJanr: ${book.genre}.\nTavsif: ${book.description}`,
      analysis: book.analysis || null,
      uploadedAt: book.createdAt,
    };
    setActiveBook(uploadedBook);
    setCurrentView('quiz_settings');
  };

  // 2. When settings are confirmed and user starts generation
  const handleStartGeneration = async (config: QuizSettingsConfig) => {
    if (!activeBook) return;
    setActiveConfig(config);
    setGenerationError(null);
    setCurrentView('analysis_loading');

    try {
      // Step A: If book not yet analyzed, request analysis
      let currentAnalysis = activeBook.analysis;
      if (!currentAnalysis) {
        currentAnalysis = await requestBookAnalysis(activeBook.fullText, activeBook.fileName);
        setActiveBook((prev) => (prev ? { ...prev, analysis: currentAnalysis } : null));
      }

      // Step B: Generate questions based on book text & user settings
      const questions = await requestGenerateQuiz(activeBook.fullText, {
        ...config,
        bookTitle: currentAnalysis?.title || activeBook.fileName.replace(/\.pdf$/i, ''),
        language,
      });

      if (!questions || questions.length === 0) {
        throw new Error("Sun'iy intellekt savollar yarata olmadi. Iltimos, qayta urinib ko'ring.");
      }

      setActiveQuestions(questions);
      setQuizProgress({
        currentIndex: 0,
        totalQuestions: questions.length,
        answeredCount: 0,
      });
      setCurrentView('quiz_active');
    } catch (err: any) {
      console.error('Generation failure:', err);
      setGenerationError(err?.message || "Test savollarini yaratib bo'lmadi. Qayta urinib ko'ring.");
    }
  };

  // 3. When quiz is submitted: Evaluate answers
  const handleQuizSubmit = async (answers: Record<string, string>, timeSpentSeconds: number) => {
    if (!activeBook || !activeConfig) return;

    setIsEvaluatingAnswers(true);
    try {
      const detailedQuestions = await Promise.all(
        activeQuestions.map(async (q) => {
          const userAns = answers[q.id] || '';
          let isCorrect = false;
          let evaluationFeedback: string | undefined = undefined;

          if (q.type === 'short_answer') {
            if (!userAns.trim()) {
              isCorrect = false;
              evaluationFeedback = "Javob berilmadi.";
            } else {
              const evalResult = await requestEvaluateShortAnswer(
                q.question,
                userAns,
                q.correctAnswer,
                q.bookFactReference || ''
              );
              isCorrect = evalResult.isCorrect;
              evaluationFeedback = evalResult.feedback;
            }
          } else {
            // Multiple choice / True-False direct match
            isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          }

          return {
            questionId: q.id,
            questionText: q.question,
            type: q.type,
            chapterOrSection: q.chapterOrSection,
            userAnswer: userAns,
            correctAnswer: q.correctAnswer,
            isCorrect,
            explanation: q.explanation,
            bookFactReference: q.bookFactReference,
            evaluationFeedback,
          };
        })
      );

      const correctAnswers = detailedQuestions.filter((q) => q.isCorrect).length;
      const totalQuestions = detailedQuestions.length;
      const incorrectAnswers = detailedQuestions.filter((q) => q.userAnswer && !q.isCorrect).length;
      const unansweredQuestions = totalQuestions - (correctAnswers + incorrectAnswers);
      const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      const record: QuizResultRecord = {
        id: `quiz_${Date.now()}`,
        date: new Date().toLocaleDateString('uz-UZ'),
        completedAt: new Date().toISOString(),
        bookTitle: activeBook.analysis?.title || activeBook.fileName.replace(/\.pdf$/i, ''),
        bookFileName: activeBook.fileName,
        config: activeConfig,
        scorePercentage,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        totalQuestions,
        timeTakenSeconds: timeSpentSeconds,
        difficulty: activeConfig.difficulty,
        questionTypes: activeConfig.questionTypes,
        questions: detailedQuestions,
        scoreLabel: getScoreLabel(scorePercentage),
      };

      const updatedHistory = saveQuizResult(record);
      setSavedQuizzes(updatedHistory);
      setActiveResult(record);
      setCurrentView('quiz_results');
    } catch (err: any) {
      console.error('Quiz evaluation error:', err);
      alert("Natijalarni baholashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsEvaluatingAnswers(false);
    }
  };

  // Retake quiz
  const handleRetakeQuiz = (customQuiz?: QuizResultRecord) => {
    const targetQuiz = customQuiz || activeResult;
    if (!targetQuiz) return;

    if (activeBook && activeBook.fullText) {
      handleStartGeneration(targetQuiz.config);
    } else {
      setActiveConfig(targetQuiz.config);
      setCurrentView('quiz_settings');
    }
  };

  // Open past quiz from history or dashboard
  const handleOpenSavedQuiz = (quiz: QuizResultRecord) => {
    setActiveResult(quiz);
    setCurrentView('answer_review');
  };

  // Delete saved quiz
  const handleDeleteQuiz = (quizId: string) => {
    const updated = deleteQuizResult(quizId);
    setSavedQuizzes(updated);
  };

  // Start brand new quiz flow
  const handleStartNewQuiz = () => {
    setActiveBook(null);
    setActiveConfig(null);
    setActiveQuestions([]);
    setActiveResult(null);
    setGenerationError(null);
    setCurrentView('home');
  };

  const dashboardStats = calculateDashboardStats(savedQuizzes);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home') {
            handleStartNewQuiz();
          } else {
            setCurrentView(view);
          }
        }}
        savedQuizCount={savedQuizzes.length}
        quizProgress={quizProgress}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* 1. Home View */}
        {currentView === 'home' && (
          <HomePage onBookReady={handleBookReady} />
        )}

        {/* 2. Library View (Kutubxona katalogi) */}
        {currentView === 'library' && (
          <LibraryView
            onReadBook={handleReadBook}
            onTakeQuiz={handleTakeQuizFromLibrary}
          />
        )}

        {/* 3. Admin Panel View (Kitoblarni qo'shish, tahrirlash, o'chirish) */}
        {currentView === 'admin' && (
          <AdminPanelView
            onReadBook={handleReadBook}
            onTakeQuiz={handleTakeQuizFromLibrary}
          />
        )}

        {/* 4. Built-in PDF Reader View */}
        {currentView === 'pdf_reader' && selectedReaderBook && (
          <PdfReaderView
            book={selectedReaderBook}
            onBack={() => setCurrentView('library')}
            onStartQuiz={handleTakeQuizFromLibrary}
          />
        )}

        {/* 5. Quiz Settings View */}
        {currentView === 'quiz_settings' && activeBook && (
          <QuizSettingsView
            book={activeBook}
            onBack={() => setCurrentView('home')}
            onStartGeneration={handleStartGeneration}
          />
        )}

        {/* 6. Analysis & Generation Loading Screen */}
        {currentView === 'analysis_loading' && activeBook && activeConfig && (
          <AnalysisLoading
            book={activeBook}
            config={activeConfig}
            error={generationError}
            onRetry={() => handleStartGeneration(activeConfig)}
            onCancel={() => setCurrentView('quiz_settings')}
          />
        )}

        {/* 7. Active Quiz View */}
        {currentView === 'quiz_active' && activeBook && activeQuestions.length > 0 && (
          <QuizView
            book={activeBook}
            questions={activeQuestions}
            onSubmit={handleQuizSubmit}
            onExit={() => setCurrentView('home')}
            onProgressChange={setQuizProgress}
          />
        )}

        {/* 8. Results View */}
        {currentView === 'quiz_results' && activeResult && (
          <ResultsView
            result={activeResult}
            onReviewAnswers={() => setCurrentView('answer_review')}
            onRetakeQuiz={() => handleRetakeQuiz()}
            onNewQuiz={handleStartNewQuiz}
            onViewHistory={() => setCurrentView('my_quizzes')}
          />
        )}

        {/* 9. Answer Review View */}
        {currentView === 'answer_review' && activeResult && (
          <AnswerReviewView
            result={activeResult}
            onBackToResults={() => setCurrentView('quiz_results')}
            onRetakeQuiz={() => handleRetakeQuiz()}
            onViewHistory={() => setCurrentView('my_quizzes')}
          />
        )}

        {/* 10. My Quizzes History View */}
        {currentView === 'my_quizzes' && (
          <MyQuizzesView
            quizzes={savedQuizzes}
            onSelectQuiz={handleOpenSavedQuiz}
            onRetakeQuiz={(quiz) => {
              setActiveBook({
                id: `retake_${quiz.id}`,
                fileName: quiz.bookFileName,
                fileSize: 1024 * 50,
                numPages: 10,
                wordCount: 1500,
                charCount: 8000,
                fullText: '',
                analysis: {
                  title: quiz.bookTitle,
                  summary: '',
                  chaptersOrSections: [],
                  keyTopics: [],
                  importantConcepts: [],
                  charactersOrEntities: [],
                },
                uploadedAt: new Date().toISOString(),
              });
              handleRetakeQuiz(quiz);
            }}
            onDeleteQuiz={handleDeleteQuiz}
            onNewQuiz={handleStartNewQuiz}
          />
        )}

        {/* 11. Student Dashboard View */}
        {currentView === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            recentQuizzes={savedQuizzes}
            onSelectQuiz={handleOpenSavedQuiz}
            onNewQuiz={handleStartNewQuiz}
            onViewAllHistory={() => setCurrentView('my_quizzes')}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Evaluation Loading Overlay */}
      {isEvaluatingAnswers && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base mb-1">
              {t.evaluating.title}
            </h3>
            <p className="text-xs text-slate-500">
              {t.evaluating.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">BookQuiz AI</span>
              <span>•</span>
              <span>© {new Date().getFullYear()}</span>
            </div>

            {/* Mualliflik huquqi / Creator badge */}
            <div
              id="footer-author-copyright-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>{t.footer.createdBy}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-slate-500">
            <span>{t.footer.allRightsReserved}</span>
            <span>•</span>
            <span>{t.footer.poweredBy}</span>
            <span>•</span>
            <span>{t.footer.guarantee}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
