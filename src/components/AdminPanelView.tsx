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
} from 'lucide-react';
import { LibraryBook, PaginatedBooksResponse } from '../types';
import {
  fetchLibraryBooks,
  createLibraryBook,
  updateLibraryBook,
  deleteLibraryBook,
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
  const { user, token, isAuthenticated, isAdmin, setAuthModalOpen } = useAuth();

  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated) {
      loadBooks();
    }
  }, [searchQuery, isAuthenticated]);

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

  // Auth Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t.admin.unauthorizedTitle}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            {t.admin.unauthorizedDesc}
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>{t.admin.loginAsAdmin}</span>
          </button>
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-900 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.admin.title}</span>
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
              {t.admin.statsUploadLimit}
            </span>
            <Upload className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">500 MB</p>
        </div>
      </div>

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
    </div>
  );
};
