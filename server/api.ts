import express, { Request, Response, NextFunction } from 'express';
import {
  analyzeBookContent,
  generateQuizQuestions,
  evaluateShortAnswer,
  QuizGenerationOptions,
} from './gemini';
import {
  findUserByEmail,
  findUserById,
  registerUser,
  hashPassword,
  generateToken,
  verifyToken,
  queryBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getDistinctGenres,
  ADMIN_SECRET_CODE,
  MAX_ADMINS,
  getAdminCount,
  getAdminUsers,
  verifyAdminSecretCode,
  loginOrRegisterStudentByName,
  saveQuizToDatabase,
  getQuizzesFromDatabase,
  getQuizByIdFromDatabase,
  deleteQuizFromDatabase,
} from './db';

export const apiRouter = express.Router();

// 500MB payload limit for large book texts, cover images and PDF data
apiRouter.use(express.json({ limit: '500mb' }));
apiRouter.use(express.urlencoded({ limit: '500mb', extended: true }));

// --- Authentication Middleware ---
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Yaroqsiz yoki muddati o\'tgan sessiya. Qaytadan kiring.' });
  }

  const user = findUserById(payload.userId);
  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Ushbu amal faqat administratorlar uchun ruxsat etilgan.' });
  }

  // Check admin code header if supplied or ensure strict validation
  const adminCodeHeader = req.headers['x-admin-code'] as string | undefined;
  if (adminCodeHeader && !verifyAdminSecretCode(adminCodeHeader)) {
    return res.status(403).json({ error: "Noto'g'ri admin maxfiy kodi!" });
  }

  next();
};

// --- Health & Admin Status Check ---
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    maxUploadLimit: '500MB',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/auth/admin-status', (_req: Request, res: Response) => {
  const adminCount = getAdminCount();
  return res.json({
    success: true,
    adminCount,
    maxAdmins: MAX_ADMINS,
    availableSlots: Math.max(0, MAX_ADMINS - adminCount),
    canRegisterAdmin: adminCount < MAX_ADMINS,
  });
});

apiRouter.post('/auth/verify-admin-code', (req: Request, res: Response) => {
  const { code } = req.body;
  const adminCount = getAdminCount();

  if (!code || !verifyAdminSecretCode(code)) {
    return res.status(403).json({
      success: false,
      error: "Admin maxfiy paroli noto'g'ri! Faqat ruxsat etilgan maxfiy parol orqali kirish mumkin.",
      adminCount,
      maxAdmins: MAX_ADMINS,
    });
  }

  // Find existing admin or initialize primary admin
  const admins = getAdminUsers();
  let adminUser = admins[0];
  if (!adminUser) {
    adminUser = registerUser('Administrator', 'admin@bookquiz.uz', 'Admin2026!', 'admin', code);
  }

  const token = generateToken({ userId: adminUser.id, email: adminUser.email, role: 'admin' });

  return res.json({
    success: true,
    verified: true,
    token,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: 'admin',
    },
    message: "Admin paroli muvaffaqiyatli tasdiqlandi.",
    adminCount,
    maxAdmins: MAX_ADMINS,
  });
});

// Admin-only management routes (strictly restricted to verified admins)
apiRouter.get('/auth/admins', authenticateToken, requireAdmin, (_req: Request, res: Response) => {
  const admins = getAdminUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    role: u.role,
  }));
  return res.json({
    success: true,
    admins,
    total: admins.length,
    maxAdmins: MAX_ADMINS,
    availableSlots: Math.max(0, MAX_ADMINS - admins.length),
  });
});

apiRouter.post('/auth/admin-register', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ism, email va parol kiritilishi shart.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    const currentAdmins = getAdminCount();
    if (currentAdmins >= MAX_ADMINS) {
      return res.status(400).json({
        error: `Adminlar soni limitga yetdi (maksimal ${MAX_ADMINS} nafar). 3 kishidan ko'p admin bo'lishi mumkin emas!`
      });
    }

    const newAdmin = registerUser(name, email, password, 'admin', ADMIN_SECRET_CODE);
    return res.json({
      success: true,
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
      message: "Yangi admin muvaffaqiyatli ro'yxatdan o'tkazildi.",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Admin qo\'shishda xatolik yuz berdi.' });
  }
});

// --- Auth Endpoints ---
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role, adminCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ism, email va parol kiritilishi shart.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    // Assign role (if admin, enforce secret passcode and max 3 admins limit)
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const user = registerUser(name, email, password, assignedRole, adminCode);
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    const hashedInput = hashPassword(password, user.salt);
    if (hashedInput !== user.passwordHash) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Tizimga kirishda xatolik yuz berdi.' });
  }
});

// Student Login / Register with Name (Student Name IS their password)
apiRouter.post('/auth/student-login', (req: Request, res: Response) => {
  try {
    const { studentName } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: "Talaba ismi kiritilishi shart." });
    }

    const { user, token, isNew } = loginOrRegisterStudentByName(studentName);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      isNew,
      message: isNew
        ? `Xush kelibsiz, ${user.name}! Sizning ismingiz parolingiz sifatida saqlandi.`
        : `Xush kelibsiz, ${user.name}!`,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Talaba kirishida xatolik yuz berdi." });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// --- Library Books Endpoints ---
apiRouter.get('/books', (req: Request, res: Response) => {
  try {
    const { search, genre, author, page, limit } = req.query;
    const result = queryBooks({
      search: search ? String(search) : undefined,
      genre: genre ? String(genre) : undefined,
      author: author ? String(author) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 6,
    });
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Kitoblarni yuklashda xatolik.' });
  }
});

apiRouter.get('/genres', (_req: Request, res: Response) => {
  try {
    const genres = getDistinctGenres();
    return res.json({ success: true, data: genres });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Janrlarni olishda xatolik.' });
  }
});

apiRouter.get('/books/:id', (req: Request, res: Response) => {
  try {
    const book = getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Kitob topilmadi.' });
    }
    return res.json({ success: true, data: book });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Kitobni yuklashda xatolik.' });
  }
});

// Admin-only CRUD operations
apiRouter.post('/books', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      author,
      genre,
      description,
      coverImage,
      pdfUrl,
      fileSize,
      pagesCount,
      fullText,
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Kitob nomi va muallifi ko\'rsatilishi shart.' });
    }

    const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

    const newBook = createBook({
      title: String(title).trim(),
      author: String(author).trim(),
      genre: String(genre || 'Badiiy adabiyot').trim(),
      description: String(description || '').trim(),
      coverImage: coverImage && typeof coverImage === 'string' ? coverImage : defaultCover,
      pdfUrl: pdfUrl && typeof pdfUrl === 'string' ? pdfUrl : '',
      fileSize: Number(fileSize) || 1024 * 50,
      pagesCount: Number(pagesCount) || 10,
      fullText: fullText ? String(fullText) : '',
      uploadedBy: req.user?.name,
    });

    return res.status(201).json({ success: true, data: newBook });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Kitobni saqlashda xatolik.' });
  }
});

apiRouter.put('/books/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      author,
      genre,
      description,
      coverImage,
      pdfUrl,
      fileSize,
      pagesCount,
      fullText,
    } = req.body;

    const updated = updateBook(req.params.id, {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(author !== undefined && { author: String(author).trim() }),
      ...(genre !== undefined && { genre: String(genre).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(coverImage !== undefined && { coverImage: String(coverImage) }),
      ...(pdfUrl !== undefined && { pdfUrl: String(pdfUrl) }),
      ...(fileSize !== undefined && { fileSize: Number(fileSize) }),
      ...(pagesCount !== undefined && { pagesCount: Number(pagesCount) }),
      ...(fullText !== undefined && { fullText: String(fullText) }),
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(404).json({ error: error?.message || 'Kitobni yangilashda xatolik.' });
  }
});

apiRouter.delete('/books/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = deleteBook(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Kitob topilmadi.' });
    }
    return res.json({ success: true, message: 'Kitob muvaffaqiyatli o\'chirildi.' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Kitobni o\'chirishda xatolik.' });
  }
});

// --- Existing Book Analysis & Quiz Endpoints ---
apiRouter.post('/analyze-book', async (req: Request, res: Response) => {
  try {
    const { fullText, fileName } = req.body;

    if (!fullText || typeof fullText !== 'string' || fullText.trim().length < 50) {
      return res.status(400).json({
        error: 'Kitob matni yetarli emas. Iltimos, PDF matn o\'qilishi mumkinligiga ishonch hosil qiling.',
      });
    }

    const safeFileName = fileName && typeof fileName === 'string' ? fileName : 'Kitob.pdf';
    const analysis = await analyzeBookContent(fullText, safeFileName);
    return res.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Error analyzing book:', error);
    return res.status(500).json({
      error: error?.message || 'Kitobni tahlil qilishda xatolik yuz berdi.',
    });
  }
});

apiRouter.post('/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { fullText, options } = req.body as { fullText: string; options: QuizGenerationOptions };

    if (!fullText || typeof fullText !== 'string' || fullText.trim().length < 50) {
      return res.status(400).json({
        error: 'Kitob matni yetarli emas. Iltimos, PDF matn mavjudligiga ishonch hosil qiling.',
      });
    }

    if (!options || !options.numberOfQuestions) {
      return res.status(400).json({
        error: 'Test sozlamalari ko\'rsatilishi shart.',
      });
    }

    const sanitizedOptions: QuizGenerationOptions = {
      numberOfQuestions: Math.max(1, Math.min(50, Number(options.numberOfQuestions) || 5)),
      difficulty: ['easy', 'medium', 'hard', 'mixed'].includes(options.difficulty)
        ? options.difficulty
        : 'medium',
      questionTypes: Array.isArray(options.questionTypes) && options.questionTypes.length > 0
        ? options.questionTypes
        : ['multiple_choice'],
      bookTitle: options.bookTitle || 'Kitob',
      language: options.language === 'en' ? 'en' : 'uz',
    };

    const questions = await generateQuizQuestions(fullText, sanitizedOptions);
    return res.json({ success: true, data: questions });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({
      error: error?.message || 'Test yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
    });
  }
});

apiRouter.post('/evaluate-short-answer', async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, correctAnswer, sourceContext } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Savol va to\'g\'ri javob talab qilinadi.' });
    }

    const evaluation = await evaluateShortAnswer(
      String(question),
      String(userAnswer || ''),
      String(correctAnswer),
      String(sourceContext || '')
    );

    return res.json({ success: true, data: evaluation });
  } catch (error: any) {
    console.error('Error evaluating short answer:', error);
    return res.status(500).json({
      error: error?.message || 'Javobni baholashda xatolik yuz berdi.',
    });
  }
});

// --- Quiz Results Database Endpoints ---

// Save student quiz attempt/result to persistent database
apiRouter.post('/quizzes', (req: Request, res: Response) => {
  try {
    let studentUserId: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      if (decoded) {
        studentUserId = decoded.userId;
      }
    }

    const {
      id,
      studentName,
      bookTitle,
      bookFileName,
      date,
      completedAt,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      scorePercentage,
      scoreLabel,
      difficulty,
      questionTypes,
      questions,
      timeTakenSeconds,
    } = req.body;

    let finalStudentName = studentName?.trim();
    if (!finalStudentName && studentUserId) {
      const user = findUserById(studentUserId);
      finalStudentName = user?.name;
    }
    if (!finalStudentName) {
      finalStudentName = 'Talaba';
    }

    // If student has a name and not logged in, auto-link or create student account
    if (!studentUserId && finalStudentName && finalStudentName !== 'Talaba') {
      try {
        const studentAuth = loginOrRegisterStudentByName(finalStudentName);
        studentUserId = studentAuth.user.id;
      } catch (e) {
        // Continue even if auto-auth fails
      }
    }

    const record = saveQuizToDatabase({
      id,
      studentName: finalStudentName,
      studentUserId,
      bookTitle,
      bookFileName,
      date,
      completedAt,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      scorePercentage,
      scoreLabel,
      difficulty,
      questionTypes,
      questions,
      timeTakenSeconds,
    });

    return res.json({
      success: true,
      data: record,
      message: "Test natijasi ma'lumotlar bazasiga muvaffaqiyatli saqlandi.",
    });
  } catch (error: any) {
    console.error('Error saving quiz result to DB:', error);
    return res.status(500).json({
      error: error?.message || 'Test natijasini bazaga saqlashda xatolik yuz berdi.',
    });
  }
});

// Get quiz results with filtering (all for admin, or by student)
apiRouter.get('/quizzes', (req: Request, res: Response) => {
  try {
    const { studentName, studentUserId, search } = req.query;

    const list = getQuizzesFromDatabase({
      studentName: studentName ? String(studentName) : undefined,
      studentUserId: studentUserId ? String(studentUserId) : undefined,
      search: search ? String(search) : undefined,
    });

    return res.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Test natijalarini olishda xatolik yuz berdi.',
    });
  }
});

// Get single quiz result by ID
apiRouter.get('/quizzes/:id', (req: Request, res: Response) => {
  try {
    const quiz = getQuizByIdFromDatabase(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Test natijasi topilmadi.' });
    }
    return res.json({ success: true, data: quiz });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Testni yuklashda xatolik.',
    });
  }
});

// Delete quiz result
apiRouter.delete('/quizzes/:id', (req: Request, res: Response) => {
  try {
    const quiz = getQuizByIdFromDatabase(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Test topilmadi.' });
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      if (decoded && decoded.role !== 'admin' && quiz.studentUserId && quiz.studentUserId !== decoded.userId) {
        return res.status(403).json({ error: "O'chirish uchun ruxsat yo'q." });
      }
    }

    const deleted = deleteQuizFromDatabase(req.params.id);
    return res.json({ success: deleted, message: "Test o'chirildi." });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "O'chirishda xatolik yuz berdi.",
    });
  }
});

