export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';
export type Language = 'uz' | 'en';

export interface BookAnalysis {
  title: string;
  detectedAuthor?: string;
  summary: string;
  chaptersOrSections: string[];
  keyTopics: string[];
  importantConcepts: string[];
  charactersOrEntities: string[];
}

export interface UploadedBook {
  id: string;
  fileName: string;
  fileSize: number;
  numPages: number;
  wordCount: number;
  charCount: number;
  fullText: string;
  pdfUrl?: string;
  analysis: BookAnalysis | null;
  uploadedAt: string;
  isSample?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // 4 options for multiple choice, ['True', 'False'] for true_false
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation: string;
  sourceContext: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  semanticFeedback?: string;
}

export interface QuizSettingsConfig {
  numberOfQuestions: number; // 5, 10, 20, 30, 50
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
}

export interface QuizResultRecord {
  id: string;
  studentName?: string;
  studentUserId?: string;
  bookTitle: string;
  bookFileName: string;
  date: string;
  completedAt?: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  scorePercentage: number;
  scoreLabel: string;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  questions: QuizQuestion[];
  timeTakenSeconds?: number;
  config?: QuizSettingsConfig;
  isProvisional?: boolean;
  completionPercentage?: number;
  accuracyPercentage?: number;
  tabSwitchCount?: number;
  lastActivityAt?: string;
}

export interface ProvisionalQuizStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  completionPercentage: number;
  accuracyPercentage: number;
  tabSwitchCount: number;
  lastUpdated: string;
  lastEventReason?: string;
}

export interface ActiveQuizSession {
  book: UploadedBook;
  questions: QuizQuestion[];
  config?: QuizSettingsConfig;
  currentIndex: number;
  answers: Record<string, string>;
  tabSwitchCount: number;
  startTime: number;
  lastActiveTime: number;
  stats: ProvisionalQuizStats;
  isProvisional: boolean;
}

export interface StudentDashboardStats {
  totalQuizzes: number;
  questionsAnswered: number;
  averageScore: number;
  bestScore: number;
}

export interface QuizProgressState {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  provisionalStats?: ProvisionalQuizStats;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'student';
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverImage: string;
  pdfUrl?: string; // Data URL or API endpoint
  fileSize: number;
  pagesCount: number;
  createdAt: string;
  fullText?: string;
  analysis?: BookAnalysis | null;
}

export interface PaginatedBooksResponse {
  books: LibraryBook[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export type ActiveAppView =
  | 'home'
  | 'library'
  | 'admin'
  | 'pdf_reader'
  | 'quiz_settings'
  | 'analysis_loading'
  | 'quiz_active'
  | 'quiz_results'
  | 'answer_review'
  | 'my_quizzes'
  | 'dashboard';
