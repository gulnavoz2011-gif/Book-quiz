import { QuizResultRecord, StudentDashboardStats } from '../types';

const STORAGE_KEY_QUIZZES = 'bookquiz_ai_history_v1';

const INITIAL_DEMO_QUIZ: QuizResultRecord = {
  id: 'quiz_demo_atomic_habits',
  bookTitle: 'Atom odatlar: 4 qonun tizimi',
  bookFileName: 'Atomic_Habits.pdf',
  date: '2026-yil 17-sentyabr',
  totalQuestions: 20,
  correctAnswers: 17,
  incorrectAnswers: 3,
  unansweredQuestions: 0,
  scorePercentage: 85,
  scoreLabel: 'Juda yaxshi',
  difficulty: 'medium',
  questionTypes: ['multiple_choice', 'true_false'],
  timeTakenSeconds: 340,
  questions: [
    {
      id: 'demo_1',
      question: "Kitobga ko'ra, har kuni 1 foizga yaxshilanish bir yilda qanday matematik natijaga olib keladi?",
      type: 'multiple_choice',
      options: ['10 barobar yaxshiroq', '37 barobar yaxshiroq', '100 barobar yaxshiroq', '365 barobar yaxshiroq'],
      correctAnswer: '37 barobar yaxshiroq',
      userAnswer: '37 barobar yaxshiroq',
      isCorrect: true,
      explanation: "Kitobda tushuntirilishicha, agar har kuni 1 foizga o'ssangiz, bir yil yakunida 37 barobar yaxshiroq natijaga erishasiz.",
      sourceContext: "Matematik hisob-kitob shuni ko'rsatadi: bir yil davomida har kuni 1% o'sish oxir-oqibat 37 barobar yaxshilanishga olib keladi.",
      difficulty: 'medium',
      topic: 'Asoslar',
    },
    {
      id: 'demo_2',
      question: "Rost yoki Yolg'on: G'oliblar va mag'lublarning maqsadlari turlicha bo'ladi.",
      type: 'true_false',
      options: ['Rost', "Yolg'on"],
      correctAnswer: "Yolg'on",
      userAnswer: "Yolg'on",
      isCorrect: true,
      explanation: "Kitobda ta'kidlanishicha, g'oliblar va mag'lublarning maqsadi bir xil; ularni ajratib turadigan narsa - bu ular yo'lga qo'ygan tizimlardir.",
      sourceContext: "1-muammo: G'oliblar va mag'lublarning maqsadlari bir xil.",
      difficulty: 'easy',
      topic: 'Tizimlar va Maqsadlar',
    },
    {
      id: 'demo_3',
      question: "Xulq-atvorni o'zgartirishning 3-qoidasi nima?",
      type: 'multiple_choice',
      options: ["Ko'zga tashlanadigan qiling", 'Jozibali qiling', 'Oson qiling', 'Qoniqish beradigan qiling'],
      correctAnswer: 'Oson qiling',
      userAnswer: 'Oson qiling',
      isCorrect: true,
      explanation: 'Kitobda 4 ta qoida keltirilgan: 1-qoida: Ko\'zga tashlanadigan qiling; 2-qoida: Jozibali qiling; 3-qoida: Oson qiling; 4-qoida: Qoniqish beradigan qiling.',
      sourceContext: '3-qoida (Javob reaksiyasi): Oson qiling.',
      difficulty: 'medium',
      topic: 'To\'rt Qoida',
    }
  ],
};

export function getSavedQuizzes(): QuizResultRecord[] {
  if (typeof window === 'undefined') return [INITIAL_DEMO_QUIZ];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify([INITIAL_DEMO_QUIZ]));
      return [INITIAL_DEMO_QUIZ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [INITIAL_DEMO_QUIZ];
  } catch (e) {
    console.error('Failed to load quizzes from localStorage', e);
    return [INITIAL_DEMO_QUIZ];
  }
}

export function saveQuizResult(quiz: QuizResultRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedQuizzes();
    const updated = [quiz, ...existing.filter(q => q.id !== quiz.id)];
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz to localStorage', e);
  }
}

export function deleteQuizResult(quizId: string): QuizResultRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getSavedQuizzes();
    const updated = existing.filter(q => q.id !== quizId);
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete quiz from localStorage', e);
    return [];
  }
}

export function calculateDashboardStats(quizzes: QuizResultRecord[]): StudentDashboardStats {
  if (!quizzes.length) {
    return {
      totalQuizzes: 0,
      questionsAnswered: 0,
      averageScore: 0,
      bestScore: 0,
    };
  }

  const totalQuizzes = quizzes.length;
  let totalQuestionsAnswered = 0;
  let totalScorePercentage = 0;
  let bestScore = 0;

  for (const q of quizzes) {
    const answeredInThisQuiz = q.totalQuestions - (q.unansweredQuestions || 0);
    totalQuestionsAnswered += answeredInThisQuiz;
    totalScorePercentage += q.scorePercentage;
    if (q.scorePercentage > bestScore) {
      bestScore = q.scorePercentage;
    }
  }

  const averageScore = Math.round(totalScorePercentage / totalQuizzes);

  return {
    totalQuizzes,
    questionsAnswered: totalQuestionsAnswered,
    averageScore,
    bestScore,
  };
}

export function getScoreLabel(percentage: number, lang: 'uz' | 'en' = 'uz'): string {
  if (lang === 'en') {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Very Good';
    if (percentage >= 50) return 'Good';
    return 'Keep Practicing';
  }
  if (percentage >= 90) return "A'lo";
  if (percentage >= 75) return 'Juda yaxshi';
  if (percentage >= 50) return 'Yaxshi';
  return 'Mashq qilish kerak';
}
