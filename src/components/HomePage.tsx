import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  FileCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { SAMPLE_BOOKS, SampleBook } from '../data/sampleBooks';
import { extractTextFromPdf, formatFileSize, ExtractionProgress } from '../utils/pdfExtractor';
import { UploadedBook } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  onBookReady: (book: UploadedBook) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onBookReady }) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<{
    fileName: string;
    fileSize: number;
    numPages: number;
    wordCount: number;
    fullText: string;
  } | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setExtractedPreview(null);
    setSelectedFile(file);

    // Initial validation
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage(t.home.errorInvalidPdf);
      return;
    }

    if (file.size === 0) {
      setErrorMessage(t.home.errorEmptyPdf);
      return;
    }

    setIsProcessing(true);
    try {
      const extracted = await extractTextFromPdf(file, (p) => {
        setProgress(p);
      });

      setExtractedPreview({
        fileName: extracted.fileName,
        fileSize: extracted.fileSize,
        numPages: extracted.numPages,
        wordCount: extracted.wordCount,
        fullText: extracted.fullText,
      });
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(
        err?.message || t.home.errorExtractFailed
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToSettings = () => {
    if (!extractedPreview) return;

    const bookData: UploadedBook = {
      id: `book_${Date.now()}`,
      fileName: extractedPreview.fileName,
      fileSize: extractedPreview.fileSize,
      numPages: extractedPreview.numPages,
      wordCount: extractedPreview.wordCount,
      charCount: extractedPreview.fullText.length,
      fullText: extractedPreview.fullText,
      analysis: null,
      uploadedAt: new Date().toISOString(),
      isSample: false,
    };

    onBookReady(bookData);
  };

  const handleSelectSampleBook = (sample: SampleBook) => {
    setErrorMessage(null);
    const bookData: UploadedBook = {
      id: `sample_${sample.id}_${Date.now()}`,
      fileName: sample.fileName,
      fileSize: 1024 * 48,
      numPages: sample.pageCount,
      wordCount: sample.wordCount,
      charCount: sample.content.length,
      fullText: sample.content,
      analysis: {
        title: sample.title,
        detectedAuthor: sample.author,
        summary: sample.description,
        chaptersOrSections: ['Kirish', 'Asosiy tamoyillar', 'Muhim xulosalar'],
        keyTopics: [sample.category, 'Asoslar', 'Amaliyot'],
        importantConcepts: ['Asosiy tushunchalar', 'Qoidalar', 'Tizim'],
        charactersOrEntities: [],
      },
      uploadedAt: new Date().toISOString(),
      isSample: true,
    };

    onBookReady(bookData);
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setExtractedPreview(null);
    setProgress(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{t.home.heroBadge}</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
          {language === 'uz' ? (
            <>Istalgan kitobni <span className="text-blue-600">aqlli testga</span> aylantiring</>
          ) : (
            <>Turn any book into an <span className="text-blue-600">intelligent quiz</span></>
          )}
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          {t.home.heroSubtitle}
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-12 transition-all">
        <input
          ref={fileInputRef}
          type="file"
          id="pdf-file-input"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {!extractedPreview && !isProcessing && (
          <div
            id="pdf-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4 transition-transform hover:scale-110">
              <Upload className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t.home.dropzoneTitle}
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {t.home.dropzoneSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="btn-trigger-upload"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t.home.browseFiles}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" /> PDF
              </span>
              <span>•</span>
              <span>{t.home.fileLimitNote}</span>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div id="pdf-extraction-status" className="py-12 px-4 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {progress?.status || t.home.processingPdf}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {selectedFile?.name} ({selectedFile ? formatFileSize(selectedFile.size) : ''})
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress?.percent || 15}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{t.home.extractingPages}</span>
              <span>{progress?.percent || 15}%</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isProcessing && (
          <div
            id="pdf-upload-error"
            className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 mt-4"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-rose-900 mb-1">
                {language === 'uz' ? 'Hujjatni qayta ishlashda muammo' : 'Issue Processing Document'}
              </h4>
              <p className="text-rose-700 text-xs sm:text-sm">{errorMessage}</p>
              <div className="mt-3 flex gap-3">
                <button
                  id="btn-retry-upload"
                  onClick={handleResetUpload}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
                >
                  {language === 'uz' ? 'Qayta urinish' : 'Try Again'}
                </button>
                <button
                  id="btn-select-different-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 font-medium text-xs transition-colors"
                >
                  {language === 'uz' ? 'Boshqa PDF tanlash' : 'Select Another File'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Preview & Confirmation */}
        {extractedPreview && !isProcessing && (
          <div id="pdf-extracted-card" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 text-red-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1">
                      {extractedPreview.fileName}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{formatFileSize(extractedPreview.fileSize)}</span>
                    <span>•</span>
                    <span>{extractedPreview.numPages} {t.home.statPages.toLowerCase()}</span>
                    <span>•</span>
                    <span>~{extractedPreview.wordCount.toLocaleString()} {language === 'uz' ? "ta so'z" : 'words'}</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-change-file"
                onClick={handleResetUpload}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                {t.home.changeFile}
              </button>
            </div>

            {/* Extracted Text Excerpt Preview */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t.home.sampleExcerptTitle}
                </span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                  {t.home.previewBadge}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-3 font-mono bg-white p-3 rounded-lg border border-slate-200/60">
                {extractedPreview.fullText.slice(0, 450)}...
              </p>
            </div>

            {/* Next Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                id="btn-generate-quiz-action"
                onClick={handleProceedToSettings}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:translate-x-0.5"
              >
                <span>{t.home.startConfigBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sample Books Quick Start Section */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              {t.home.sampleBooksHeading}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.home.sampleBooksSub}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {SAMPLE_BOOKS.map((sample) => (
            <div
              key={sample.id}
              id={`sample-book-${sample.id}`}
              onClick={() => handleSelectSampleBook(sample)}
              className="group p-5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {sample.category}
                  </span>
                  <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 text-sm mb-1 line-clamp-1 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-500 mb-3">{language === 'uz' ? 'Muallif' : 'Author'}: {sample.author}</p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {sample.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {sample.pageCount} {t.home.statPages.toLowerCase()}
                </span>
                <span className="font-medium text-blue-600 group-hover:underline flex items-center gap-1">
                  {t.home.takeQuizBtn}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Guarantees & Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200/80">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">{t.home.feature1Title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.home.feature1Desc}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">{t.home.feature2Title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.home.feature2Desc}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">{t.home.feature3Title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.home.feature3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
