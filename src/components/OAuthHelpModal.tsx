import React, { useState, useEffect } from 'react';
import { X, Key, Check, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { getSavedClientId, saveClientId } from '../core/google-auth';

interface OAuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (clientId: string) => void;
}

export const OAuthHelpModal: React.FC<OAuthHelpModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [clientId, setClientId] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientId(getSavedClientId());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveClientId(clientId);
    setSavedSuccess(true);
    onSaved?.(clientId.trim());
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold">Cấu hình Google OAuth Client ID</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client ID Input */}
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Google Client ID của bạn
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="VD: 123456789-abcdefghijk.apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono shadow-sm"
            />
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Client ID chỉ lưu trong trình duyệt của bạn (<code className="bg-slate-200/70 px-1 rounded">localStorage</code>), không bao giờ gửi đến máy chủ nào.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Đã lưu!
                </>
              ) : (
                'Lưu Client ID'
              )}
            </button>
          </div>

          {/* Guide Section */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Hướng dẫn tạo Client ID miễn phí (2 phút)
              </h3>
            </div>

            <ol className="space-y-3.5 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
              <li>
                Truy cập{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-medium inline-flex items-center gap-0.5 hover:underline"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                và tạo một Project mới (đặt tên ví dụ: <em>PeopleSoft Calendar Sync</em>).
              </li>
              <li>
                Vào mục <strong>APIs & Services &gt; Library</strong>, tìm kiếm{' '}
                <span className="font-semibold text-slate-800">"Google Calendar API"</span> và bấm{' '}
                <strong>Enable (Bật)</strong>.
              </li>
              <li>
                Vào mục <strong>APIs & Services &gt; OAuth consent screen</strong>:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Chọn User Type: <strong>External</strong></li>
                  <li>Điền App name & Email của bạn rồi bấm Save and Continue</li>
                  <li>Tại bước <strong>Test users</strong>: thêm địa chỉ Gmail của chính bạn để cấp quyền test</li>
                </ul>
              </li>
              <li>
                Vào mục <strong>APIs & Services &gt; Credentials</strong>:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Bấm <strong>Create Credentials</strong> &gt; chọn <strong>OAuth Client ID</strong></li>
                  <li>Application type: chọn <strong>Web application</strong></li>
                  <li>
                    Tại mục <strong>Authorized JavaScript origins</strong>: bấm Add URI và dán địa chỉ web này:
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-[11px] font-mono border border-slate-200">
                        {currentOrigin}
                      </code>
                      <button
                        onClick={copyOrigin}
                        className="px-2 py-1 text-[11px] font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
                      >
                        {copied ? 'Đã chép!' : 'Copy'}
                      </button>
                    </div>
                  </li>
                  <li>Bấm <strong>Create</strong>, sau đó copy chuỗi <strong>Client ID</strong> dán vào ô bên trên!</li>
                </ul>
              </li>
            </ol>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
              💡 <strong>Mẹo:</strong> Nếu chưa muốn tạo Google Cloud Project, bạn vẫn có thể sử dụng nút <strong>"Tải file .ics"</strong> ở bước cuối để thêm lịch vào Google Calendar / Apple Calendar ngay lập tức mà không cần cấu hình OAuth!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
