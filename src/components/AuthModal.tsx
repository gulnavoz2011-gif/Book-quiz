import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { studentLogin } = useAuth();
  const { language } = useLanguage();

  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanName = studentName.trim();
      if (!cleanName || cleanName.length < 2) {
        throw new Error(
          language === 'uz'
            ? "Iltimos, ism-sharifingizni to'liq kiriting (kamida 2 ta belgi)."
            : "Please enter your full name (minimum 2 characters)."
        );
      }
      await studentLogin(cleanName);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi. Iltimos, ma\'lumotlarni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {language === 'uz' ? 'Talaba sifatida kirish' : 'Student Access'}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
            {language === 'uz'
              ? 'Ismingiz sizning parolingiz hisoblanadi (Parol = Ism)'
              : 'Your name is your password. Easy and instant access.'}
          </p>
        </div>

        {/* Student-only Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Key className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold text-blue-950 mb-0.5">
                {language === 'uz' ? 'Talaba uchun qulay kirish:' : 'Simple Student Access:'}
              </p>
              <p className="text-blue-800">
                {language === 'uz'
                  ? "Ismingizni kiriting — ushbu ism sizning shaxsiy parolingiz bo'lib xizmat qiladi. Siz topshirgan testlar natijalari ushbu nom ostida saqlanadi."
                  : "Type your name — it acts as your personal password. All your quizzes are stored in the database."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {language === 'uz' ? 'Talaba ismi va familiyasi:' : 'Student Full Name:'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type="text"
                required
                autoFocus
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={language === 'uz' ? "Ism va familiyangizni kiriting..." : "Enter your full name..."}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 focus:outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              🔑 {language === 'uz' ? 'Parol = Ismingiz' : 'Password = Your Name'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {language === 'uz' ? 'Talaba sifatida kirish' : 'Enter as Student'}
                </span>
              </>
            )}
          </button>

          <div className="pt-2 text-center border-t border-slate-100">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {language === 'uz'
                  ? "Admin paneli uchun yuqoridagi 'Admin Panel' tugmasi orqali maxfiy parol bilan kiriladi."
                  : "For Admin access, use the 'Admin Panel' button with the secret passcode."}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
