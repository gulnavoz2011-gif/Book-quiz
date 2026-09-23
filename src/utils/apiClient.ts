import { BookAnalysis, QuizQuestion, QuizSettingsConfig, LibraryBook, PaginatedBooksResponse, User } from '../types';

export interface ApiAnalyzeResponse {
  success: boolean;
  data: BookAnalysis;
  error?: string;
}

export interface ApiGenerateResponse {
  success: boolean;
  data: QuizQuestion[];
  error?: string;
}

export interface ApiEvaluateResponse {
  success: boolean;
  data: {
    isCorrect: boolean;
    score: number;
    feedback: string;
  };
  error?: string;
}

// --- Auth APIs ---
export async function apiRegister(
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<{ token: string; user: User }> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
  }

  return { token: data.token, user: data.user };
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Email yoki parol noto\'g\'ri.');
  }

  return { token: data.token, user: data.user };
}

export async function apiGetMe(token: string): Promise<User> {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Avtorizatsiya muddati tugagan.');
  }

  return data.user;
}

// --- Library Books APIs ---
export async function fetchLibraryBooks(params: {
  search?: string;
  genre?: string;
  author?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedBooksResponse> {
  const urlParams = new URLSearchParams();
  if (params.search) urlParams.append('search', params.search);
  if (params.genre && params.genre !== 'all' && params.genre !== 'Barchasi') urlParams.append('genre', params.genre);
  if (params.author) urlParams.append('author', params.author);
  if (params.page) urlParams.append('page', String(params.page));
  if (params.limit) urlParams.append('limit', String(params.limit));

  const response = await fetch(`/api/books?${urlParams.toString()}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitoblarni yuklashda xatolik yuz berdi.');
  }

  return data.data;
}

export async function fetchBookById(id: string): Promise<LibraryBook> {
  const response = await fetch(`/api/books/${id}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitob topilmadi.');
  }
  return data.data;
}

export async function fetchDistinctGenres(): Promise<string[]> {
  const response = await fetch('/api/genres');
  const data = await response.json();
  if (!response.ok || !data.success) return [];
  return data.data;
}

export async function createLibraryBook(
  bookData: Omit<LibraryBook, 'id' | 'createdAt'>,
  token: string
): Promise<LibraryBook> {
  const response = await fetch('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni saqlashda xatolik.');
  }
  return data.data;
}

export async function updateLibraryBook(
  id: string,
  bookData: Partial<LibraryBook>,
  token: string
): Promise<LibraryBook> {
  const response = await fetch(`/api/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni yangilashda xatolik.');
  }
  return data.data;
}

export async function deleteLibraryBook(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/books/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni o\'chirishda xatolik.');
  }
}

// --- Quiz & Analysis APIs ---
export async function requestBookAnalysis(
  fullText: string,
  fileName: string
): Promise<BookAnalysis> {
  const response = await fetch('/api/analyze-book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText, fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const result: ApiAnalyzeResponse = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Kitob matnini tahlil qilib bo'lmadi.");
  }

  return result.data;
}

export async function requestGenerateQuiz(
  fullText: string,
  options: QuizSettingsConfig & { bookTitle?: string; language?: 'uz' | 'en' }
): Promise<QuizQuestion[]> {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText, options }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server xatoligi: ${response.status}`);
  }

  const result: ApiGenerateResponse = await response.json();
  if (!result.success || !result.data || !Array.isArray(result.data)) {
    throw new Error(result.error || "Test savollarini yaratib bo'lmadi.");
  }

  return result.data;
}

export async function requestEvaluateShortAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  sourceContext: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  try {
    const response = await fetch('/api/evaluate-short-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userAnswer, correctAnswer, sourceContext }),
    });

    if (!response.ok) {
      throw new Error(`Evaluation status ${response.status}`);
    }

    const result: ApiEvaluateResponse = await response.json();
    if (result.success && result.data) {
      return {
        isCorrect: result.data.isCorrect,
        feedback: result.data.feedback,
      };
    }
  } catch (err) {
    console.warn('Backend evaluation fallback to client matching:', err);
  }

  const u = userAnswer.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const c = correctAnswer.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const isMatch = u === c || u.includes(c) || c.includes(u);
  return {
    isCorrect: isMatch,
    feedback: isMatch ? "Javob kitobdagi asosiy faktlarni to'g'ri ifodalagan." : "Javob kitobdagi ma'lumotlar bilan mos kelmadi.",
  };
}
