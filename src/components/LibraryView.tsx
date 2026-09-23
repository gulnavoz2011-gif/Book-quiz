import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  Calendar,
  FileText,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { LibraryBook, PaginatedBooksResponse } from '../types';
import { fetchLibraryBooks, fetchDistinctGenres } from '../utils/apiClient';
import { formatFileSize } from '../utils/pdfExtractor';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface LibraryViewProps {
  onReadBook: (book: LibraryBook) => void;
  onTakeQuiz: (book: LibraryBook) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onReadBook,
  onTakeQuiz,
}) => {
  const { t, language } = useLanguage();
  const { isAuthenticated, setAuthModalOpen } = useAuth();

  const [booksData, setBooksData] = useState<PaginatedBooksResponse>({
    books: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 6,
  });
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load genres
  useEffect(() => {
    fetchDistinctGenres()
      .then((res) => setGenres(res))
      .catch((err) => console.warn('Could not load genres:', err));
  }, []);

  // Load books with pagination and filter
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchLibraryBooks({
      search: searchQuery,
      genre: selectedGenre === 'all' ? undefined : selectedGenre,
      page: currentPage,
      limit: 6,
    })
      .then((res) => {
        if (!isCancelled) {
          setBooksData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err?.message || 'Kitoblarni yuklab bo\'lmadi');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedGenre, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleGenreSelect = (g: string) => {
    setSelectedGenre(g);
    setCurrentPage(1);
  };

  // Auth requirement gate check
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xl shadow-slate-100 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {t.library.title}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            {t.library.authRequiredNotice}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{t.auth.loginBtn} / {t.auth.registerBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.library.title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'uz' ? 'Kitoblar kutubxonasi & Katalog' : 'Curated Book Library & Catalog'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {t.library.subtitle}
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 self-start md:self-auto">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span>
              {language === 'uz'
                ? `Jami ${booksData.total} ta kitob bazada mavjud`
                : `Total ${booksData.total} books in catalog`}
            </span>
          </div>
        </div>

        {/* Search & Genre Filters */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t.library.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleGenreSelect('all')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedGenre === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.library.allGenres}
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => handleGenreSelect(g)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  selectedGenre === g
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col h-80"
            >
              <div className="w-full h-40 bg-slate-100 rounded-xl mb-4" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="mt-auto h-9 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-700">
          <p>{error}</p>
        </div>
      ) : booksData.books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">{t.library.noBooksFound}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.library.noBooksDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksData.books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col overflow-hidden group"
            >
              {/* Cover & Genre Header */}
              <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white p-4 text-center">
                    <BookOpen className="w-10 h-10 opacity-60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 backdrop-blur-sm text-white border border-white/10">
                    {book.genre}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-bold leading-snug drop-shadow line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-200 opacity-90 drop-shadow line-clamp-1">
                    {book.author}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {book.description || (language === 'uz' ? 'Kitob haqida qisqacha ma\'lumot.' : 'No description provided.')}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 pb-4 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {book.pagesCount} {t.library.pages}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      {formatFileSize(book.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => onReadBook(book)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.library.readBook}</span>
                  </button>
                  <button
                    onClick={() => onTakeQuiz(book)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{t.library.takeQuiz}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {booksData.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">
            {t.library.page} <span className="font-semibold text-slate-800">{booksData.page}</span>{' '}
            {t.library.of} <span className="font-semibold text-slate-800">{booksData.totalPages}</span>{' '}
            ({booksData.total} {t.library.showingResults})
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.library.previous}</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(booksData.totalPages, p + 1))}
              disabled={currentPage >= booksData.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <span>{t.library.next}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
