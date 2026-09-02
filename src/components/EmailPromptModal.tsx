import React, { useState, useEffect } from 'react';
import { X, Mail, ArrowRight, School, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../core/LanguageContext';

interface EmailPromptModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onConfirm: (fullEmail: string) => void;
}

export const EmailPromptModal: React.FC<EmailPromptModalProps> = ({
  isOpen,
  initialEmail = '',
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) {
        if (initialEmail.endsWith('@torontomu.ca')) {
          setUsername(initialEmail.replace('@torontomu.ca', ''));
          setUseCustomDomain(false);
        } else {
          setCustomEmail(initialEmail);
          setUseCustomDomain(true);
        }
      } else {
        setUsername('');
        setCustomEmail('');
        setUseCustomDomain(false);
      }
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleUsernameChange = (val: string) => {
    let clean = val.trim();
    if (clean.includes('@')) {
      if (clean.endsWith('@torontomu.ca')) {
        clean = clean.replace('@torontomu.ca', '');
      } else {
        setUseCustomDomain(true);
        setCustomEmail(clean);
        return;
      }
    }
    setUsername(clean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalEmail = '';

    if (useCustomDomain) {
      finalEmail = customEmail.trim();
    } else {
      const cleanUser = username.trim();
      if (!cleanUser) return;
      finalEmail = `${cleanUser}@torontomu.ca`;
    }

    if (!finalEmail) return;
    onConfirm(finalEmail);
  };

  const isValid = useCustomDomain
    ? customEmail.includes('@') && customEmail.length > 3
    : username.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-blue-50/80">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {t.emailModalTitle}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t.emailModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              {t.emailModalLabel}
            </label>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.emailModalDesc}
            </p>
          </div>

          {!useCustomDomain ? (
            /* TMU default with pre-filled suffix */
            <div className="space-y-2">
              <div className="flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden shadow-sm bg-white">
                <div className="pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder={t.emailUsernamePlaceholder}
                  className="flex-1 px-2.5 py-2.5 text-sm text-slate-900 focus:outline-none font-medium"
                />
                <span className="inline-flex items-center px-3.5 bg-slate-100 border-l border-slate-200 text-xs font-bold text-slate-600 select-none">
                  @torontomu.ca
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUseCustomDomain(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {t.btnUseOtherEmail}
                </button>
              </div>
            </div>
          ) : (
            /* Custom email input */
            <div className="space-y-2">
              <div className="flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden shadow-sm bg-white">
                <div className="pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  autoFocus
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 px-2.5 py-2.5 text-sm text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUseCustomDomain(false)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {t.btnBackToTmu}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {t.emailHintNotice}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                isValid
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:scale-[1.01]'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{t.btnConfirmImport}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
