import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  RotateCcw,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { LibraryBook } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatFileSize } from '../utils/pdfExtractor';

// Set up worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfReaderViewProps {
  book: LibraryBook;
  onBack: () => void;
  onStartQuiz: (book: LibraryBook) => void;
}

export const PdfReaderView: React.FC<PdfReaderViewProps> = ({
  book,
  onBack,
  onStartQuiz,
}) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(book.pagesCount || 1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInputVal, setPageInputVal] = useState<string>('1');
  const [displayMode, setDisplayMode] = useState<'canvas' | 'native'>('canvas');

  // Load exact PDF Document without changing anything ("qanday tashlangan bo'lsa shunday ko'rsat")
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadingPercent(0);
    setErrorMessage(null);

    async function loadPdf() {
      try {
        if (!book.pdfUrl) {
          throw new Error(
            language === 'uz'
              ? 'PDF fayli manzili mavjud emas.'
              : 'PDF file URL is missing.'
          );
        }

        const loadingTask = pdfjsLib.getDocument({
          url: book.pdfUrl,
          useSystemFonts: true,
          disableAutoFetch: false,
          disableStream: false,
          rangeChunkSize: 65536 * 16, // 1MB chunks for large files up to 500 MB
        });

        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData && progressData.total > 0 && !isCancelled) {
            const pct = Math.min(100, Math.round((progressData.loaded / progressData.total) * 100));
            setLoadingPercent(pct);
          }
        };

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setPageInputVal('1');
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading PDF in reader:', err);
        if (!isCancelled) {
          setErrorMessage(
            err?.message || (language === 'uz' ? 'PDF hujjatni yuklab bo\'lmadi' : 'Could not load PDF document')
          );
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [book.pdfUrl, language]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    let isCancelled = false;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Support high-DPI displays for crisp text
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPage(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, scale]);

  const goToPage = (num: number) => {
    const target = Math.max(1, Math.min(totalPages, num));
    setCurrentPage(target);
    setPageInputVal(String(target));
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInputVal, 10);
    if (!isNaN(val)) {
      goToPage(val);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.0, parseFloat((prev + 0.2).toFixed(1))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, parseFloat((prev - 0.2).toFixed(1))));
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 80;
      // Default standard page width is ~595pt
      const newScale = Math.max(0.7, Math.min(2.5, containerWidth / 600));
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-140px)] flex flex-col bg-slate-900 text-slate-100 select-none"
    >
      {/* Top Controls Toolbar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Book Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.reader.backToLibrary}</span>
          </button>

          <div className="border-l border-slate-700 pl-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {book.title}
              </h2>
              {book.fileSize && (
                <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {formatFileSize(book.fileSize)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="truncate max-w-xs">{book.author}</span>
              <span className="hidden md:inline text-slate-600">•</span>
              <span className="hidden md:inline text-blue-400 font-medium">500 MB gacha qo'llab-quvvatlanadi</span>
            </div>
          </div>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
            title="Oldingi sahifa (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={() => setPageInputVal(String(currentPage))}
              className="w-10 text-center py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-medium focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </form>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
            title="Keyingi sahifa (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom, Fullscreen & Create Quiz */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg border border-slate-700 p-0.5 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title={t.reader.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title={t.reader.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitWidth}
              className="px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-white hover:bg-slate-700 rounded ml-1"
              title={t.reader.fitWidth}
            >
              Fit
            </button>
          </div>

          {/* Asl PDF (Brauzer) / Canvas toggle */}
          {book.pdfUrl && (
            <button
              onClick={() => setDisplayMode((prev) => (prev === 'canvas' ? 'native' : 'canvas'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                displayMode === 'native'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={language === 'uz' ? "Asl PDF varianti (Brauzer o'quvchisi)" : "Original PDF native reader"}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {displayMode === 'native'
                  ? (language === 'uz' ? "Sahifama-sahifa ko'rinish" : "Page-by-page View")
                  : (language === 'uz' ? "Asl PDF (Brauzer)" : "Native PDF")}
              </span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs hidden sm:block"
            title={isFullscreen ? t.reader.exitFullscreen : t.reader.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Create Quiz Action */}
          <button
            onClick={() => onStartQuiz(book)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{t.reader.createQuiz}</span>
          </button>
        </div>
      </div>

      {/* Reader Main Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-slate-950">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-white mb-1">
              {language === 'uz' ? "Kitob yuklanmoqda..." : t.reader.loadingDocument}
            </p>
            <p className="text-xs text-slate-400 mb-3 truncate max-w-xs">
              {book.title} {book.fileSize ? `(${formatFileSize(book.fileSize)})` : ''}
            </p>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${loadingPercent > 0 ? loadingPercent : 35}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-400 font-medium">
              {language === 'uz'
                ? `500 MB gacha bo'lgan katta kitoblar yuklamasi qo'llab-quvvatlanadi ${loadingPercent > 0 ? `(${loadingPercent}%)` : ''}`
                : `Supports large book loading up to 500 MB ${loadingPercent > 0 ? `(${loadingPercent}%)` : ''}`}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">{t.reader.errorLoading}</h3>
            <p className="text-xs text-slate-400 mb-4">{errorMessage}</p>

            {book.pdfUrl && (
              <div className="mb-4">
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'uz' ? "Asl PDF faylini to'g'ridan-to'g'ri ochish" : "Open Original PDF Directly"}</span>
                </a>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                {t.reader.backToLibrary}
              </button>
              <button
                onClick={() => onStartQuiz(book)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                {t.reader.createQuiz}
              </button>
            </div>
          </div>
        )}

        {displayMode === 'native' && book.pdfUrl ? (
          <div className="w-full h-[calc(100vh-170px)] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <iframe
              src={`${book.pdfUrl}#page=${currentPage}`}
              className="w-full h-full border-0 rounded-xl"
              title={book.title}
            />
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isLoading || errorMessage ? 'hidden' : 'block'}`}>
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
              <canvas ref={canvasRef} className="block mx-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation (Mobile friendly) */}
      <div className="sm:hidden sticky bottom-4 mx-auto z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded-full shadow-2xl">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 bg-slate-800 rounded-full disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium font-mono">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 bg-slate-800 rounded-full disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
