import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Sliders,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { UploadedBook, QuizSettingsConfig, QuestionType, DifficultyLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuizSettingsViewProps {
  book: UploadedBook;
  onBack: () => void;
  onStartGeneration: (config: QuizSettingsConfig) => void;
}

const QUESTION_COUNT_OPTIONS = [5, 10, 20, 30, 50];

export const QuizSettingsView: React.FC<QuizSettingsViewProps> = ({
  book,
  onBack,
  onStartGeneration,
}) => {
  const { t, language } = useLanguage();
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [typeError, setTypeError] = useState<string | null>(null);

  const difficultyOptions: { id: DifficultyLevel; label: string; desc: string }[] = [
    { id: 'easy', label: t.config.difficultyEasy, desc: t.config.difficultyEasyDesc },
    { id: 'medium', label: t.config.difficultyMedium, desc: t.config.difficultyMediumDesc },
    { id: 'hard', label: t.config.difficultyHard, desc: t.config.difficultyHardDesc },
    { id: 'mixed', label: t.config.difficultyMixed, desc: t.config.difficultyMixedDesc },
  ];

  const questionTypesConfig: { id: QuestionType; label: string; desc: string }[] = [
    { id: 'multiple_choice', label: t.config.typeMC, desc: t.config.typeMCDesc },
    { id: 'true_false', label: t.config.typeTF, desc: t.config.typeTFDesc },
    { id: 'short_answer', label: t.config.typeSA, desc: t.config.typeSADesc },
  ];

  const toggleQuestionType = (type: QuestionType) => {
    setTypeError(null);
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        setTypeError(
          language === 'uz'
            ? "Kamida bitta savol turi tanlangan bo'lishi kerak."
            : "At least one question type must be selected."
        );
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGenerate = () => {
    if (selectedTypes.length === 0) {
      setTypeError(
        language === 'uz'
          ? "Iltimos, kamida bitta savol turini tanlang."
          : "Please select at least one question type."
      );
      return;
    }

    onStartGeneration({
      numberOfQuestions,
      difficulty,
      questionTypes: selectedTypes,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <button
        id="btn-back-to-upload"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.config.chooseAnotherBook}
      </button>

      {/* Card Header with Book Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {t.config.docReady}
              </span>
              {book.isSample && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {t.config.sampleText}
                </span>
              )}
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
              {book.fileName.replace(/\.pdf$/i, '')}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {book.numPages} {t.home.statPages.toLowerCase()}
              </span>
              <span>•</span>
              <span>~{book.wordCount.toLocaleString()} {language === 'uz' ? "ta so'z" : 'words'}</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                {t.config.textExtractedVerified}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading text-lg font-bold text-slate-900">{t.config.title}</h3>
          </div>
          <p className="text-xs text-slate-500">
            {t.config.subtitle}
          </p>
        </div>

        {/* 1. Number of questions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            {t.config.questionCount}
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {QUESTION_COUNT_OPTIONS.map((count) => {
              const isSelected = numberOfQuestions === count;
              return (
                <button
                  key={count}
                  type="button"
                  id={`btn-question-count-${count}`}
                  onClick={() => setNumberOfQuestions(count)}
                  className={`py-3 rounded-xl font-heading text-base font-bold transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-2'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Difficulty */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            {t.config.difficulty}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {difficultyOptions.map((item) => {
              const isSelected = difficulty === item.id;
              return (
                <div
                  key={item.id}
                  id={`btn-difficulty-${item.id}`}
                  onClick={() => setDifficulty(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900">{item.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Question Types (Multiple Allowed) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t.config.questionTypes} <span className="font-normal text-slate-400 normal-case">({t.config.questionTypesHint})</span>
            </label>
            <span className="text-xs text-blue-600 font-medium">
              {selectedTypes.length} {t.config.selected}
            </span>
          </div>

          <div className="space-y-2.5">
            {questionTypesConfig.map((type) => {
              const isChecked = selectedTypes.includes(type.id);
              return (
                <div
                  key={type.id}
                  id={`btn-type-${type.id}`}
                  onClick={() => toggleQuestionType(type.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="pr-4">
                    <span className={`text-sm font-semibold block ${isChecked ? 'text-white' : 'text-slate-900'}`}>
                      {type.label}
                    </span>
                    <span className={`text-xs block mt-0.5 ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                      {type.desc}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {typeError && (
            <p className="text-xs text-rose-600 mt-2 font-medium">{typeError}</p>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{t.config.guaranteeOnlyBook}</span>
          </div>

          <button
            id="btn-confirm-generate-quiz"
            onClick={handleGenerate}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:translate-x-0.5"
          >
            <span>{t.config.generateBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
