import {
  BookAnalysis,
  QuizQuestion,
  QuizSettingsConfig,
  LibraryBook,
  PaginatedBooksResponse,
  User,
  QuizResultRecord,
} from '../types';

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
  role: 'admin' | 'user' = 'user',
  adminCode?: string
): Promise<{ token: string; user: User }> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, adminCode }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
  }

  return { token: data.token, user: data.user };
}

export async function apiVerifyAdminCode(code: string): Promise<{
  success: boolean;
  verified: boolean;
  token?: string;
  user?: User;
  adminCount: number;
  maxAdmins: number;
}> {
  const response = await fetch('/api/auth/verify-admin-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Maxfiy parol noto'g'ri! Faqat ruxsat etilgan maxfiy parol orqali kirish mumkin.");
  }

  return data;
}

export async function apiGetAdminsList(token: string): Promise<{
  admins: { id: string; name: string; email: string; createdAt: string; role: string }[];
  total: number;
  maxAdmins: number;
  availableSlots: number;
}> {
  const response = await fetch('/api/auth/admins', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Adminlar ro\'yxatini olishda xatolik.');
  }

  return data;
}

export async function apiRegisterNewAdmin(
  payload: { name: string; email: string; password: string },
  token: string
): Promise<{ user: User; message: string }> {
  const response = await fetch('/api/auth/admin-register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Yangi adminni ro\'yxatdan o\'tkazishda xatolik.');
  }

  return data;
}

export async function apiGetAdminStatus(): Promise<{
  success: boolean;
  adminCount: number;
  maxAdmins: number;
  availableSlots: number;
  canRegisterAdmin: boolean;
}> {
  const response = await fetch('/api/auth/admin-status');
  const data = await response.json();
  if (!response.ok || !data.success) {
    return {
      success: false,
      adminCount: 1,
      maxAdmins: 3,
      availableSlots: 2,
      canRegisterAdmin: true,
    };
  }
  return data;
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

export async function apiStudentLogin(
  studentName: string
): Promise<{ token: string; user: User; isNew: boolean; message: string }> {
  const response = await fetch('/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Talaba kirishida xatolik.');
  }

  return { token: data.token, user: data.user, isNew: data.isNew, message: data.message };
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
  token: string,
  adminCode?: string
): Promise<LibraryBook> {
  const code = adminCode || (typeof window !== 'undefined' ? sessionStorage.getItem('bookquiz_admin_passcode') : null) || '';
  const response = await fetch('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-admin-code': code,
    },
    body: JSON.stringify(bookData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni saqlashda xatolik.');
  }
  return data.data;
}

/**
 * Automatically saves a book provided for test generation directly to the library.
 * Server prevents duplicate entries ("bitta kitobni ikki marta saqlama").
 */
export async function apiAutoSaveBookToLibrary(
  bookData: {
    title: string;
    author?: string;
    genre?: string;
    description?: string;
    coverImage?: string;
    pdfUrl?: string;
    fileSize?: number;
    pagesCount?: number;
    fullText?: string;
    uploadedBy?: string;
  },
  token?: string | null
): Promise<{ success: boolean; data: LibraryBook; isNew: boolean; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/books/auto-save', {
    method: 'POST',
    headers,
    body: JSON.stringify(bookData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni kutubxonaga saqlashda xatolik yuz berdi.');
  }

  return data;
}

/**
 * Uploads original PDF file to server verbatim so it is preserved byte-for-byte.
 * Ensures the exact PDF variant is stored without any alteration.
 */
export async function apiUploadPdfFile(
  file: File
): Promise<{ success: boolean; pdfUrl: string; fileName: string; fileSize: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const response = await fetch('/api/upload-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
      'x-file-name': encodeURIComponent(file.name),
    },
    body: arrayBuffer,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'PDF faylini serverga yuklashda xatolik yuz berdi.');
  }

  return data;
}

export async function updateLibraryBook(
  id: string,
  bookData: Partial<LibraryBook>,
  token: string,
  adminCode?: string
): Promise<LibraryBook> {
  const code = adminCode || (typeof window !== 'undefined' ? sessionStorage.getItem('bookquiz_admin_passcode') : null) || '';
  const response = await fetch(`/api/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-admin-code': code,
    },
    body: JSON.stringify(bookData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Kitobni yangilashda xatolik.');
  }
  return data.data;
}

export async function deleteLibraryBook(
  id: string,
  token: string,
  adminCode?: string
): Promise<void> {
  const code = adminCode || (typeof window !== 'undefined' ? sessionStorage.getItem('bookquiz_admin_passcode') : null) || '';
  const response = await fetch(`/api/books/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-admin-code': code,
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

// --- Quiz Database Persistence APIs ---

export async function apiSaveQuizToDatabase(
  quiz: QuizResultRecord,
  token?: string | null
): Promise<QuizResultRecord> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/quizzes', {
    method: 'POST',
    headers,
    body: JSON.stringify(quiz),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Test natijasini bazaga saqlab bo\'lmadi.');
  }

  return data.data;
}

export async function apiGetQuizzesFromDatabase(params?: {
  studentName?: string;
  studentUserId?: string;
  search?: string;
  token?: string | null;
}): Promise<QuizResultRecord[]> {
  const query = new URLSearchParams();
  if (params?.studentName) query.set('studentName', params.studentName);
  if (params?.studentUserId) query.set('studentUserId', params.studentUserId);
  if (params?.search) query.set('search', params.search);

  const headers: Record<string, string> = {};
  if (params?.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  const response = await fetch(`/api/quizzes?${query.toString()}`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Testlarni yuklab bo\'lmadi.');
  }

  return data.data;
}

export async function apiGetQuizByIdFromDatabase(id: string): Promise<QuizResultRecord> {
  const response = await fetch(`/api/quizzes/${id}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Test topilmadi.');
  }
  return data.data;
}

export async function apiDeleteQuizFromDatabase(id: string, token?: string | null): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/quizzes/${id}`, {
    method: 'DELETE',
    headers,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Testni o\'chirib bo\'lmadi.');
  }

  return true;
}

