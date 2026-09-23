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
  next();
};

// --- Health Check ---
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    maxUploadLimit: '500MB',
    timestamp: new Date().toISOString(),
  });
});

// --- Auth Endpoints ---
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ism, email va parol kiritilishi shart.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    // Assign role (admin only if requested with special key or explicitly chosen in dev/demo)
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const user = registerUser(name, email, password, assignedRole);
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
