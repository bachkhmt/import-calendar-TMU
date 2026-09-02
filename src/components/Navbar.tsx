import React from 'react';
import { Calendar, Key, CheckCircle2, AlertCircle, RotateCcw, Languages } from 'lucide-react';
import { useTranslation } from '../core/LanguageContext';

interface NavbarProps {
  hasClientId: boolean;
  onOpenOAuthModal: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasClientId,
  onOpenOAuthModal,
  onReset,
}) => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {t.appTitle}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm"
            title="Switch Language (EN / VI)"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'en' ? 'EN' : 'VI'}</span>
          </button>

          {/* OAuth status button */}
          <button
            onClick={onOpenOAuthModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasClientId
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to configure Google OAuth Client ID"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Google OAuth:</span>
            {hasClientId ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t.oauthStatusSaved}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" /> {t.oauthStatusNeeded}
              </span>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title={t.resetApp}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.resetApp}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
