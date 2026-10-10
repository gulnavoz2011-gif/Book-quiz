import { QuizQuestion, ProvisionalQuizStats, ActiveQuizSession, QuizResultRecord, UploadedBook, QuizSettingsConfig } from '../types';
import { getScoreLabel } from './storage';

const ACTIVE_QUIZ_SESSION_KEY = 'bookquiz_active_session_v2';
const PROVISIONAL_RESULTS_KEY = 'bookquiz_provisional_results_v2';

/**
 * Checks whether an answer is correct for multiple_choice, true_false, and short_answer.
 */
export function isAnswerCorrect(question: QuizQuestion, rawAnswer: string | undefined): boolean {
  if (!rawAnswer || !rawAnswer.trim()) {
    return false;
  }
  const user = rawAnswer.trim().toLowerCase();
  const correct = (question.correctAnswer || '').trim().toLowerCase();

  if (question.type === 'true_false') {
    const isUserTrue = user === 'true' || user === 'rost' || user === "to'g'ri" || user === 'togri';
    const isUserFalse = user === 'false' || user === "yolg'on" || user === 'yolgon' || user === "noto'g'ri" || user === 'notogri';
    const isCorrectTrue = correct === 'true' || correct === 'rost' || correct === "to'g'ri" || correct === 'togri';
    const isCorrectFalse = correct === 'false' || correct === "yolg'on" || correct === 'yolgon' || correct === "noto'g'ri" || correct === 'notogri';

    if (isUserTrue && isCorrectTrue) return true;
    if (isUserFalse && isCorrectFalse) return true;
    return user === correct;
  }

  if (question.type === 'multiple_choice') {
    return user === correct;
  }

  // short_answer
  if (user === correct) return true;
  // If user answer contains the correct answer or key part
  if (correct.length > 3 && user.includes(correct)) return true;
  if (user.length > 3 && correct.includes(user)) return true;

  return false;
}

/**
 * Calculates live provisional quiz stats based on the exact required formulas:
 * 1. Total questions in the quiz.
 * 2. Questions answered so far.
 * 3. Correct answers.
 * 4. Incorrect answers = answered questions - correct answers.
 * 5. Unanswered questions = total questions - answered questions.
 * 6. Completion percentage = (answered questions / total questions) * 100.
 * 7. Accuracy percentage = (correct answers / answered questions) * 100.
 *
 * Crucial behavior: Leaving the quiz must NOT mark unanswered questions as incorrect.
 * Only answered questions are considered for correct/incorrect count.
 */
export function calculateProvisionalQuizStats(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  tabSwitchCount: number = 0,
  lastEventReason?: string
): ProvisionalQuizStats {
  const totalQuestions = questions.length;
  let answeredQuestions = 0;
  let correctAnswers = 0;

  // Track each question exactly once
  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans !== undefined && ans !== null && ans.trim().length > 0) {
      answeredQuestions += 1;
      if (isAnswerCorrect(q, ans)) {
        correctAnswers += 1;
      }
    }
  });

  const incorrectAnswers = answeredQuestions - correctAnswers;
  const unansweredQuestions = totalQuestions - answeredQuestions;

  const completionPercentage =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const accuracyPercentage =
    answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    completionPercentage,
    accuracyPercentage,
    tabSwitchCount,
    lastUpdated: new Date().toISOString(),
    lastEventReason,
  };
}

/**
 * Saves active quiz session to localStorage for instant recovery across tabs/refreshes.
 */
export function saveActiveQuizSession(session: ActiveQuizSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_QUIZ_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to save active quiz session to localStorage:', err);
  }
}

/**
 * Retrieves the saved active quiz session if one exists.
 */
export function loadActiveQuizSession(): ActiveQuizSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_QUIZ_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveQuizSession;
    if (
      session &&
      session.book &&
      Array.isArray(session.questions) &&
      session.questions.length > 0
    ) {
      return session;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load active quiz session:', err);
    return null;
  }
}

/**
 * Clears the active quiz session once completed or explicitly abandoned.
 */
export function clearActiveQuizSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_QUIZ_SESSION_KEY);
  } catch (err) {
    console.warn('Failed to clear active quiz session:', err);
  }
}

/**
 * Creates or updates a Provisional QuizResultRecord for historical viewing and database sync.
 */
export function buildProvisionalRecord(
  book: UploadedBook,
  questions: QuizQuestion[],
  answers: Record<string, string>,
  stats: ProvisionalQuizStats,
  config?: QuizSettingsConfig,
  studentName: string = 'Talaba',
  studentUserId?: string,
  startTime: number = Date.now()
): QuizResultRecord {
  const detailedQuestions = questions.map((q) => {
    const userAns = answers[q.id] || '';
    const isAnswered = userAns.trim().length > 0;
    const isCorrect = isAnswered ? isAnswerCorrect(q, userAns) : false;

    return {
      ...q,
      userAnswer: userAns,
      isCorrect,
    };
  });

  const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

  return {
    id: `quiz_provisional_${book.id}_${startTime}`,
    studentName,
    studentUserId,
    bookTitle: book.analysis?.title || book.fileName.replace(/\.pdf$/i, ''),
    bookFileName: book.fileName,
    date: new Date().toLocaleDateString('uz-UZ'),
    completedAt: new Date().toISOString(),
    totalQuestions: stats.totalQuestions,
    correctAnswers: stats.correctAnswers,
    incorrectAnswers: stats.incorrectAnswers,
    unansweredQuestions: stats.unansweredQuestions,
    scorePercentage: stats.accuracyPercentage, // Provisional accuracy
    scoreLabel: getScoreLabel(stats.accuracyPercentage),
    difficulty: config?.difficulty || 'medium',
    questionTypes: config?.questionTypes || ['multiple_choice'],
    questions: detailedQuestions,
    timeTakenSeconds: timeSpentSeconds,
    config,
    isProvisional: true,
    completionPercentage: stats.completionPercentage,
    accuracyPercentage: stats.accuracyPercentage,
    tabSwitchCount: stats.tabSwitchCount,
    lastActivityAt: stats.lastUpdated,
  };
}
