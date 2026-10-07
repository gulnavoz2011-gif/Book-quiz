import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Upload,
  BookOpen,
  Search,
  HardDrive,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  LockKeyhole,
  GraduationCap,
  Clock,
  Award,
  HelpCircle,
  UserPlus,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { LibraryBook, PaginatedBooksResponse, QuizResultRecord } from '../types';
import {
  fetchLibraryBooks,
  createLibraryBook,
  updateLibraryBook,
  deleteLibraryBook,
  apiGetQuizzesFromDatabase,
  apiDeleteQuizFromDatabase,
  apiGetAdminsList,
  apiRegisterNewAdmin,
} from '../utils/apiClient';
import { extractTextFromPdf, formatFileSize } from '../utils/pdfExtractor';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface AdminPanelViewProps {
  onReadBook: (book: LibraryBook) => void;
  onTakeQuiz: (book: LibraryBook) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  onReadBook,
  onTakeQuiz,
}) => {
  const { t, language } = useLanguage();
  const {
    user,
    token,
    isAuthenticated,
    isAdmin,
    adminPasscode,
    isAdminVerified,
    verifyAdminPasscode,
    logoutAdminSession,
    adminStatus,
    refreshAdminStatus,
    setAuthModalOpen,
  } = useAuth();

  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Passcode verification state
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [showPasscodeText, setShowPasscodeText] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formGenre, setFormGenre] = useState('Badiiy adabiyot');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formFileSize, setFormFileSize] = useState<number>(0);
  const [formPagesCount, setFormPagesCount] = useState<number>(10);
  const [formFullText, setFormFullText] = useState('');

  // Upload & Extraction Progress for large files (up to 500MB)
  const [uploadProgress, setUploadProgress] = useState<{
    active: boolean;
    percent: number;
    status: string;
  }>({
    active: false,
    percent: 0,
    status: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Tab State
  const [adminTab, setAdminTab] = useState<'books' | 'quizzes' | 'admins'>('books');
  const [studentQuizzes, setStudentQuizzes] = useState<QuizResultRecord[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState<boolean>(false);
  const [quizSearchQuery, setQuizSearchQuery] = useState<string>('');
  const [selectedQuizDetail, setSelectedQuizDetail] = useState<QuizResultRecord | null>(null);
  const [quizDeleteConfirmId, setQuizDeleteConfirmId] = useState<string | null>(null);

  // Admin accounts management state (Admin registration only from admin panel)
  const [adminsList, setAdminsList] = useState<{ id: string; name: string; email: string; createdAt: string; role: string }[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminRegisterError, setAdminRegisterError] = useState<string | null>(null);
  const [adminRegisterSuccess, setAdminRegisterSuccess] = useState<string | null>(null);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);

  // Load books
  const loadBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchLibraryBooks({
        search: searchQuery,
        limit: 50,
      });
      setBooks(res.books);
      setTotalBooks(res.total);
    } catch (err: any) {
      setError(err?.message || 'Kitoblarni yuklashda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load student quizzes from database
  const loadStudentQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const list = await apiGetQuizzesFromDatabase({ token });
      setStudentQuizzes(list);
    } catch (e) {
      console.error('Failed to load student quizzes:', e);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  // Load admin accounts list (only for verified admins)
  const loadAdminsList = async () => {
    if (!token) return;
    setIsLoadingAdmins(true);
    try {
      const data = await apiGetAdminsList(token);
      setAdminsList(data.admins);
    } catch (e) {
      console.warn('Could not load admins list:', e);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleRegisterNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdminRegisterError(null);
    setAdminRegisterSuccess(null);
    setIsRegisteringAdmin(true);

    try {
      if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
        throw new Error("Iltimos, barcha maydonlarni to'liq to'ldiring.");
      }
      if (newAdminPassword.length < 6) {
        throw new Error("Yangi admin paroli kamida 6 ta belgidan iborat bo'lishi kerak.");
      }

      const res = await apiRegisterNewAdmin(
        {
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword.trim(),
        },
        token
      );

      setAdminRegisterSuccess(`${res.user.name} muvaffaqiyatli yangi administrator sifatida ro'yxatdan o'tkazildi!`);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      await loadAdminsList();
      await refreshAdminStatus();
    } catch (err: any) {
      setAdminRegisterError(err?.message || "Admin qo'shishda xatolik yuz berdi.");
    } finally {
      setIsRegisteringAdmin(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await apiDeleteQuizFromDatabase(quizId, token);
      setStudentQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      setQuizDeleteConfirmId(null);
    } catch (err: any) {
      alert(err?.message || "Testni o'chirishda xatolik yuz berdi.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin && adminPasscode) {
      loadBooks();
      loadStudentQuizzes();
      loadAdminsList();
    }
  }, [searchQuery, isAuthenticated, isAdmin, adminPasscode]);

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);

    const clean = enteredPasscode.trim();
    if (!clean) {
      setPasscodeError("Iltimos, maxfiy kodni kiriting!");
      return;
    }

    setIsVerifyingPasscode(true);
    try {
      await verifyAdminPasscode(clean);
      setEnteredPasscode('');
      await loadBooks();
    } catch (err: any) {
      setPasscodeError(err?.message || "Kiritilgan maxfiy kod noto'g'ri! Faqat ruxsat etilgan administrator kodi orqali kirish mumkin.");
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  // Handle PDF file selection with 500MB limit and progress bar
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 500 MB limit
    const MAX_500MB = 500 * 1024 * 1024;
    if (file.size > MAX_500MB) {
      alert(
        language === 'uz'
          ? 'Fayl hajmi 500 MB dan katta. Iltimos, 500 MB gacha bo\'lgan PDF yuklang.'
          : 'File size exceeds 500 MB limit. Please upload a PDF under 500 MB.'
      );
      return;
    }

    setSelectedFile(file);
    setFormFileSize(file.size);

    // Auto fill title if empty
    if (!formTitle) {
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setFormTitle(cleanTitle);
    }

    // Start progress extraction
    setUploadProgress({
      active: true,
      percent: 10,
      status: language === 'uz' ? 'PDF fayl o\'qilmoqda...' : 'Reading PDF file...',
    });

    try {
      // Convert to Data URL for in-app reader
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const p = Math.round((event.loaded / event.total) * 30);
          setUploadProgress((prev) => ({
            ...prev,
            percent: Math.max(prev.percent, p),
            status: language === 'uz' ? `Fayl xotiraga yuklanmoqda (${p}%)...` : `Loading file data (${p}%)...`,
          }));
        }
      };

      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Also extract text
      const extracted = await extractTextFromPdf(file, (p) => {
        setUploadProgress({
          active: true,
          percent: 30 + Math.round(p.percent * 0.65),
          status: p.status,
        });
      });

      const dataUrl = await dataUrlPromise;
      setFormPdfUrl(dataUrl);
      setFormPagesCount(extracted.numPages);
      setFormFullText(extracted.fullText);

      setUploadProgress({
        active: false,
        percent: 100,
        status: language === 'uz' ? 'PDF muvaffaqiyatli qayta ishlandi!' : 'PDF successfully processed!',
      });
    } catch (err: any) {
      console.error('Error processing PDF in admin:', err);
      setUploadProgress({
        active: false,
        percent: 0,
        status: '',
      });
      alert(err?.message || 'PDF matnini tahlil qilishda xatolik.');
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormGenre('Badiiy adabiyot');
    setFormDescription('');
    setFormCoverImage('');
    setSelectedFile(null);
    setFormPdfUrl('');
    setFormFileSize(0);
    setFormPagesCount(10);
    setFormFullText('');
    setUploadProgress({ active: false, percent: 0, status: '' });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (book: LibraryBook) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormGenre(book.genre);
    setFormDescription(book.description);
    setFormCoverImage(book.coverImage);
    setSelectedFile(null);
    setFormPdfUrl(book.pdfUrl || '');
    setFormFileSize(book.fileSize);
    setFormPagesCount(book.pagesCount);
    setFormFullText(book.fullText || '');
    setUploadProgress({ active: false, percent: 0, status: '' });
    setIsModalOpen(true);
  };

  // Save Book (Create or Edit)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle,
        author: formAuthor,
        genre: formGenre,
        description: formDescription,
        coverImage:
          formCoverImage ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        pdfUrl: formPdfUrl,
        fileSize: formFileSize || 1024 * 200,
        pagesCount: formPagesCount || 10,
        fullText: formFullText,
      };

      if (editingBook) {
        await updateLibraryBook(editingBook.id, payload, token);
      } else {
        await createLibraryBook(payload, token);
      }

      setIsModalOpen(false);
      await loadBooks();
    } catch (err: any) {
      alert(err?.message || 'Kitobni saqlashda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (id: string) => {
    if (!token) return;
    try {
      await deleteLibraryBook(id, token);
      setDeleteConfirmId(null);
      await loadBooks();
    } catch (err: any) {
      alert(err?.message || 'Kitobni o\'chirishda xatolik yuz berdi.');
    }
  };

  // Auth Guard: Admin passcode MUST be entered to connect or access the admin panel
  // Without entering the password, no one can connect or view the admin panel!
  if (!adminPasscode || !isAdminVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Top banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
          
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Xavfsizlik Qulfi</span>
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2 text-center tracking-tight">
            Maxfiy Parolni Kiriting
          </h2>
          
          <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
            Admin paneliga ulanish uchun maxfiy parolni kiritish shart. <strong>Parolni kiritmasdan admin paneliga ulanib bo'lmaydi</strong>. Maksimal 3 nafar tasdiqlangan administrator uchun ruxsat berilgan.
          </p>

          {/* Admin Slots Quota Counter */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Adminlar kvotasi:</span>
            </div>
            <span className="font-extrabold text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs">
              {adminStatus ? `${adminStatus.adminCount}/3 nafar` : '1/3 nafar'}
            </span>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            {passcodeError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{passcodeError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Maxfiy Paroli:
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="off"
                  value={enteredPasscode}
                  onChange={(e) => {
                    setEnteredPasscode(e.target.value);
                    setPasscodeError(null);
                  }}
                  placeholder="Maxfiy parolni kiriting..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-mono tracking-wider text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isVerifyingPasscode ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LockKeyhole className="w-4 h-4" />
                  <span>Parolni tasdiqlash va Admin paneliga ulanish</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-400">
                🔒 Parolni kiritmasdan admin paneliga ulanish imkonsiz
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Total Storage Used
  const totalStorageBytes = books.reduce((acc, b) => acc + (b.fileSize || 0), 0);
  const distinctGenresCount = new Set(books.map((b) => b.genre)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-900 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.admin.title}</span>
            </div>

            {/* Verified Passcode Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin tasdiqlangan (Xavfsiz)</span>
            </div>

            {/* Admin Quota Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Adminlar: {adminStatus ? `${adminStatus.adminCount}/3` : '1/3'} band (Max 3 kishi)</span>
            </div>

            {/* Lock session button */}
            <button
              onClick={logoutAdminSession}
              title="Admin seansini qulflash"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition-colors"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Qulflash</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'uz' ? 'Kitoblar ma\'lumotlar bazasi boshqaruvi' : 'Book Database & Catalog Management'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t.admin.subtitle}</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.addNewBook}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {t.admin.statsTotalBooks}
            </span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalBooks}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {t.admin.statsGenres}
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{distinctGenresCount}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {t.admin.statsStorage}
            </span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatFileSize(totalStorageBytes)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {language === 'uz' ? 'Talabalar testlari' : 'Student Quizzes'}
            </span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{studentQuizzes.length}</p>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit mb-6">
        <button
          type="button"
          onClick={() => setAdminTab('books')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'books'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'uz' ? `Kitoblar bazasi (${totalBooks})` : `Books Catalog (${totalBooks})`}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('quizzes');
            loadStudentQuizzes();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'quizzes'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{language === 'uz' ? `Talabalar test natijalari (${studentQuizzes.length})` : `Student Quiz Results (${studentQuizzes.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('admins');
            loadAdminsList();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'admins'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-600" />
          <span>{language === 'uz' ? `Adminlar boshqaruvi (${adminStatus ? `${adminStatus.adminCount}/3` : '1/3'})` : `Admins Management (${adminStatus ? `${adminStatus.adminCount}/3` : '1/3'})`}</span>
        </button>
      </div>

      {adminTab === 'books' && (
        <>
          {/* Search Bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.library.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t.admin.tableTitle}</th>
                <th className="py-3.5 px-4">{t.admin.tableAuthor}</th>
                <th className="py-3.5 px-4">{t.admin.tableGenre}</th>
                <th className="py-3.5 px-4">{t.admin.tablePages}</th>
                <th className="py-3.5 px-4">{t.admin.tableSize}</th>
                <th className="py-3.5 px-4 text-right">{t.admin.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                    <span>Yuklanmoqda...</span>
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t.library.noBooksFound}
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.coverImage}
                          alt=""
                          className="w-8 h-11 object-cover rounded shadow-sm flex-shrink-0"
                        />
                        <div className="truncate max-w-xs">
                          <p className="truncate font-bold text-slate-900">{b.title}</p>
                          <p className="text-[10px] text-slate-400">ID: {b.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{b.author}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {b.genre}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{b.pagesCount} bet</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {formatFileSize(b.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onReadBook(b)}
                          title="PDF o'qish"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title={t.admin.editBook}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(b.id)}
                          title={t.admin.deleteBook}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {adminTab === 'quizzes' && (
    /* Student Quizzes Database View */
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={quizSearchQuery}
            onChange={(e) => setQuizSearchQuery(e.target.value)}
            placeholder={
              language === 'uz'
                ? "Talaba ismi yoki kitob nomi bo'yicha qidirish..."
                : "Search by student name or book title..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <button
          onClick={loadStudentQuizzes}
          disabled={isLoadingQuizzes}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 self-end sm:self-auto cursor-pointer"
        >
          <span>{language === 'uz' ? 'Yangilash' : 'Refresh'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{language === 'uz' ? 'Talaba (Ism)' : 'Student Name'}</th>
                <th className="py-3.5 px-4">{language === 'uz' ? 'Kitob nomi' : 'Book Title'}</th>
                <th className="py-3.5 px-4">{language === 'uz' ? 'Natija / Ball' : 'Score'}</th>
                <th className="py-3.5 px-4">{language === 'uz' ? 'To\'g\'ri / Jami' : 'Correct / Total'}</th>
                <th className="py-3.5 px-4">{language === 'uz' ? 'Vaqt' : 'Time'}</th>
                <th className="py-3.5 px-4">{language === 'uz' ? 'Sana' : 'Date'}</th>
                <th className="py-3.5 px-4 text-right">{t.admin.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingQuizzes ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                    <span>Talabalar testlari yuklanmoqda...</span>
                  </td>
                </tr>
              ) : studentQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {language === 'uz'
                      ? "Hozircha bazada talabalar test natijalari mavjud emas. Talabalar kitobdan test ishlaganda bu yerda aks etadi."
                      : "No student quiz results in database yet."}
                  </td>
                </tr>
              ) : (
                studentQuizzes
                  .filter((q) => {
                    if (!quizSearchQuery.trim()) return true;
                    const s = quizSearchQuery.toLowerCase();
                    return (
                      (q.studentName || '').toLowerCase().includes(s) ||
                      (q.bookTitle || '').toLowerCase().includes(s) ||
                      (q.date || '').toLowerCase().includes(s)
                    );
                  })
                  .map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {(q.studentName || 'T')[0].toUpperCase()}
                          </div>
                          <span>{q.studentName || 'Talaba'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {q.bookTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            q.scorePercentage >= 80
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : q.scorePercentage >= 60
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {q.scorePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {q.correctAnswers} / {q.totalQuestions}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {Math.floor((q.timeTakenSeconds || 0) / 60)} daq {(q.timeTakenSeconds || 0) % 60} son
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {q.date}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedQuizDetail(q)}
                            title="Natijani to'liq ko'rish"
                            className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ko'rish</span>
                          </button>
                          <button
                            onClick={() => setQuizDeleteConfirmId(q.id)}
                            title="Testni o'chirish"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {adminTab === 'admins' && (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 mb-3">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Administratorlar Boshqaruvi</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Adminlar Ro'yxati va Yangi Admin Qo'shish
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
            Tizimda <strong>maksimal 3 nafar administrator</strong> faoliyat yurita oladi. Yangi adminlar faqat ushbu admin panelidan ro'yxatdan o'tkaziladi.
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block opacity-10">
          <Shield className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Quota & Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Jami Adminlar:
          </span>
          <p className="text-2xl font-black text-slate-900">
            {adminsList.length || (adminStatus ? adminStatus.adminCount : 1)} / 3
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Maksimal limit: 3 nafar</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Bo'sh O'rinlar:
          </span>
          <p className="text-2xl font-black text-emerald-600">
            {Math.max(0, 3 - (adminsList.length || (adminStatus ? adminStatus.adminCount : 1)))} ta
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {(adminsList.length || (adminStatus ? adminStatus.adminCount : 1)) >= 3
              ? "Kvotada bo'sh joy qolmagan"
              : "Yangi admin qo'shish mumkin"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Xavfsizlik Holati:
          </span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm mt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Maxfiy parol faol</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Barcha adminlar himoyalangan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Registered Admins List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Mavjud Administratorlar ({adminsList.length || (adminStatus ? adminStatus.adminCount : 1)})
              </h3>
              <p className="text-xs text-slate-500">
                Admin paneliga kirish huquqiga ega bo'lgan foydalanuvchilar
              </p>
            </div>
            <button
              type="button"
              onClick={loadAdminsList}
              disabled={isLoadingAdmins}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {isLoadingAdmins ? 'Yangilanmoqda...' : 'Yangilash'}
            </button>
          </div>

          {isLoadingAdmins ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Yuklanmoqda...</span>
            </div>
          ) : adminsList.length === 0 ? (
            <div className="p-6 text-slate-600 text-xs space-y-2">
              <p className="font-medium">Administrator ma'lumotlari yuklanmoqda yoki asosiy administrator faol.</p>
              <button
                onClick={loadAdminsList}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200"
              >
                Ro'yxatni yuklash
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {adminsList.map((adm, index) => (
                <div key={adm.id || index} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm">
                      {adm.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{adm.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Admin #{index + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{adm.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <UserCheck className="w-3 h-3" />
                      <span>Faol</span>
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'Asosiy admin'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add New Admin Form (ONLY from admin panel) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 self-start">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Yangi Admin Qo'shish
              </h3>
              <p className="text-[11px] text-slate-500">
                Faqat admin paneli orqali ro'yxatdan o'tkaziladi
              </p>
            </div>
          </div>

          {(adminsList.length >= 3 || (adminStatus && adminStatus.adminCount >= 3)) ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Maksimal limitga yetildi (3/3)</span>
              </div>
              <p className="leading-relaxed">
                Tizimda 3 kishidan boshqa hech kim admin bo'la olmaydi. Yangi admin qo'shish imkonsiz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegisterNewAdmin} className="space-y-4">
              {adminRegisterError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{adminRegisterError}</span>
                </div>
              )}

              {adminRegisterSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{adminRegisterSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Ismi va Familiyasi:
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Masalan: Dilshod Rahimov"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Elektron Pochta (Email):
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin2@bookquiz.uz"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangi Admin Paroli:
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Kamida 6 ta belgi bo'lishi lozim</p>
              </div>

              <button
                type="submit"
                disabled={isRegisteringAdmin}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isRegisteringAdmin ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Adminni ro'yxatdan o'tkazish</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                🔒 Yangi admin faqat tasdiqlangan maxfiy parol orqali admin paneliga kira oladi.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{t.admin.deleteBook}</h3>
            <p className="text-xs text-slate-500 mb-5">{t.admin.deleteConfirm}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t.admin.cancel}
              </button>
              <button
                onClick={() => handleDeleteBook(deleteConfirmId)}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow"
              >
                {t.admin.deleteBook}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingBook ? t.admin.editBook : t.admin.addNewBook}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'uz'
                      ? '500 MB gacha bo\'lgan PDF kitobni yuklang va bazaga saqlang'
                      : 'Upload and save books up to 500 MB into the database'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.admin.formTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Masalan: O'tkan kunlar"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.admin.formAuthor} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Abdulla Qodiriy"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.admin.formGenre}
                  </label>
                  <select
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Badiiy adabiyot">Badiiy adabiyot</option>
                    <option value="Falsafa & Psixologiya">Falsafa & Psixologiya</option>
                    <option value="Biznes & Moliya">Biznes & Moliya</option>
                    <option value="IT & Dasturlash">IT & Dasturlash</option>
                    <option value="Tarix & Biografiya">Tarix & Biografiya</option>
                    <option value="Ilmiy & Ommabop">Ilmiy & Ommabop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.admin.formCover}
                  </label>
                  <input
                    type="text"
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.admin.formDesc}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Kitob mazmuni haqida qisqacha tavsif..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* 500 MB PDF Upload Field with Progress Bar */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80">
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  {t.admin.formPdf}
                </label>
                <p className="text-[11px] text-blue-700 mb-3">{t.admin.formPdfNote}</p>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileSelect}
                  className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />

                {/* Progress bar for large PDF file uploads */}
                {uploadProgress.active && (
                  <div className="mt-3 pt-3 border-t border-blue-200/60 animate-fade-in">
                    <div className="flex justify-between text-[11px] font-semibold text-blue-900 mb-1">
                      <span>{uploadProgress.status}</span>
                      <span>{uploadProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedFile && !uploadProgress.active && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {selectedFile.name} ({formatFileSize(selectedFile.size)}) — {formPagesCount} {t.library.pages}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.admin.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadProgress.active}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? t.admin.saving : t.admin.saveBook}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Quiz Delete Confirm Dialog */}
      {quizDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {language === 'uz' ? "Test natijasini o'chirish" : "Delete Quiz Record"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'uz'
                ? "Ushbu talabaning test natijasini bazadan butunlay o'chirib tashlamoqchimisiz?"
                : "Are you sure you want to permanently delete this student quiz record?"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuizDeleteConfirmId(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t.admin.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuiz(quizDeleteConfirmId)}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow cursor-pointer"
              >
                {language === 'uz' ? "O'chirish" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Quiz Detailed Breakdown Modal */}
      {selectedQuizDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedQuizDetail.studentName || 'Talaba'} — {selectedQuizDetail.bookTitle}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{selectedQuizDetail.date}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      Ball: {selectedQuizDetail.scorePercentage}% ({selectedQuizDetail.correctAnswers}/{selectedQuizDetail.totalQuestions} to'g'ri)
                    </span>
                    <span>•</span>
                    <span>Vaqt: {Math.floor((selectedQuizDetail.timeTakenSeconds || 0) / 60)} daqiqa</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuizDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {selectedQuizDetail.questions && selectedQuizDetail.questions.length > 0 ? (
                selectedQuizDetail.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${
                      q.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {idx + 1}-savol:
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          q.isCorrect
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'bg-red-200/70 text-red-900'
                        }`}
                      >
                        {q.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">
                      {q.questionText}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-500 min-w-28">Talaba javobi:</span>
                        <span
                          className={`font-semibold ${
                            q.isCorrect ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {q.userAnswer || "(Javob berilmagan)"}
                        </span>
                      </div>

                      {!q.isCorrect && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-slate-500 min-w-28">To'g'ri javob:</span>
                          <span className="font-semibold text-emerald-800">
                            {q.correctAnswer}
                          </span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-600 text-[11px] leading-relaxed">
                          <strong className="text-slate-700">Izoh:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs text-slate-400">
                  Savollar tafsiloti saqlanmagan.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end flex-shrink-0 mt-4">
              <button
                type="button"
                onClick={() => setSelectedQuizDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
