import React, { useState } from 'react';
import {
  Calendar,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Key,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type {
  RecurringEvent,
  SemesterConfig,
  GoogleCalendarInsertResult,
} from '../core/types';
import {
  buildGoogleCalendarEvent,
  buildICalendarString,
} from '../core/calendar-exporter';
import {
  requestGoogleAccessToken,
  createGoogleCalendar,
  insertEventsToGoogleCalendar,
  getSavedUserEmail,
  saveUserEmail,
} from '../core/google-auth';
import { EmailPromptModal } from './EmailPromptModal';

interface Step4ExportProps {
  recurringEvents: RecurringEvent[];
  config: SemesterConfig;
  clientId: string;
  onOpenOAuthModal: () => void;
  onPrevStep: () => void;
  onReset: () => void;
}

export const Step4Export: React.FC<Step4ExportProps> = ({
  recurringEvents,
  config,
  clientId,
  onOpenOAuthModal,
  onPrevStep,
  onReset,
}) => {
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'authorizing' | 'creating_calendar' | 'inserting_events' | 'success' | 'error'
  >('idle');
  const [progressInfo, setProgressInfo] = useState<{
    current: number;
    total: number;
    currentTitle: string;
  }>({ current: 0, total: 0, currentTitle: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [exportResult, setExportResult] = useState<GoogleCalendarInsertResult | null>(
    null
  );
  const [downloadedIcs, setDownloadedIcs] = useState(false);
  const [userEmail, setUserEmail] = useState(getSavedUserEmail());
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const selectedEvents = recurringEvents.filter((e) => e.selected);

  const handleStartImportClick = () => {
    if (!clientId || !clientId.trim()) {
      onOpenOAuthModal();
      return;
    }
    // Ask for TMU email before starting import
    setIsEmailModalOpen(true);
  };

  const handleEmailConfirmed = (email: string) => {
    setUserEmail(email);
    saveUserEmail(email);
    setIsEmailModalOpen(false);
    executeSyncToGoogle(email);
  };

  // 1. Export via Google Calendar API with userEmail as hint
  const executeSyncToGoogle = async (emailToUse: string) => {
    setErrorMessage('');
    setSyncStatus('authorizing');

    try {
      // Step A: Request Token with email hint
      const accessToken = await requestGoogleAccessToken(clientId, emailToUse);

      // Step B: Create dedicated calendar
      setSyncStatus('creating_calendar');
      const calendarName = config.calendarName || 'Lịch học PeopleSoft';
      const createdCal = await createGoogleCalendar(
        accessToken,
        calendarName,
        config.timeZone
      );

      // Step C: Insert events
      setSyncStatus('inserting_events');
      setProgressInfo({
        current: 0,
        total: selectedEvents.length,
        currentTitle: 'Bắt đầu thêm...',
      });

      const eventsToInsert = selectedEvents.map((ev) => ({
        code: ev.code,
        payload: buildGoogleCalendarEvent(ev, config),
      }));

      const result = await insertEventsToGoogleCalendar(
        accessToken,
        createdCal.id,
        eventsToInsert,
        (current, total, title) => {
          setProgressInfo({ current, total, currentTitle: title });
        }
      );

      result.calendarSummary = calendarName;
      setExportResult(result);
      setSyncStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đồng bộ lịch');
      setSyncStatus('error');
    }
  };

  // 2. Export via .ics file download
  const handleDownloadIcs = () => {
    try {
      const icsContent = buildICalendarString(recurringEvents, config);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(config.calendarName || 'lich-hoc').replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadedIcs(true);
      setTimeout(() => setDownloadedIcs(false), 3000);
    } catch (err: any) {
      alert(`Lỗi khi tạo file .ics: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-blue-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Bước 4: Xuất Lịch Học
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Sẵn sàng đưa{' '}
          <strong className="text-slate-900">{selectedEvents.length} môn học</strong> vào lịch
          với cấu hình lặp hàng tuần và loại trừ ngày nghỉ tự động.
        </p>
      </div>

      {/* Target summary pill */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-slate-400 block">Tên lịch dự kiến:</span>
            <span className="font-bold text-slate-800 text-sm">
              {config.calendarName || 'Lịch học'}
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block">Múi giờ:</span>
            <span className="font-semibold text-slate-700">{config.timeZone}</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block">Số môn sẽ thêm:</span>
            <span className="font-semibold text-indigo-600">
              {selectedEvents.length} môn học
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block">Email TMU nhận lịch:</span>
            {userEmail ? (
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {userEmail}
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="text-indigo-600 hover:underline text-[11px] font-normal"
                >
                  (Đổi)
                </button>
              </span>
            ) : (
              <span className="text-amber-600 font-medium text-[11px]">
                Chưa nhập (sẽ hỏi khi bấm Import)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenOAuthModal}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Key className="w-3.5 h-3.5" />
          {clientId ? 'Đổi Client ID' : 'Cài đặt Client ID'}
        </button>
      </div>

      {/* Primary Export Option: Google Calendar API */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              Đồng bộ trực tiếp vào Google Calendar (Khuyên dùng)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tạo 1 Calendar mới riêng biệt trong tài khoản Google của bạn và chèn từng sự kiện lặp hàng tuần bằng API.
            </p>
          </div>
        </div>

        {/* Progress & Status */}
        {syncStatus === 'authorizing' && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 text-indigo-800 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Đang mở cửa sổ đăng nhập Google OAuth... Vui lòng cho phép quyền truy cập Lịch trong popup.</span>
          </div>
        )}

        {syncStatus === 'creating_calendar' && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 text-indigo-800 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Đang tạo calendar mới "{config.calendarName}"...</span>
          </div>
        )}

        {syncStatus === 'inserting_events' && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Đang thêm: {progressInfo.currentTitle}
              </span>
              <span>
                {progressInfo.current} / {progressInfo.total}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{
                  width: `${(progressInfo.current / (progressInfo.total || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {syncStatus === 'error' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Đồng bộ thất bại</p>
              <p className="text-xs text-rose-700">{errorMessage}</p>
              <p className="text-xs text-slate-500 pt-1">
                Gợi ý: Nếu gặp lỗi OAuth origin, hãy kiểm tra lại <em>Authorized JavaScript origins</em> trên Google Cloud Console đã bao gồm đúng URL hiện tại chưa, hoặc bạn có thể dùng nút <strong>Tải file .ics</strong> bên dưới.
              </p>
            </div>
          </div>
        )}

        {/* Success message */}
        {syncStatus === 'success' && exportResult && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-base">Đồng bộ hoàn tất!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Đã thêm thành công{' '}
                  <strong>{exportResult.successCount}</strong>/{selectedEvents.length} môn học vào lịch{' '}
                  <strong>"{exportResult.calendarSummary}"</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={exportResult.calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-all hover:scale-[1.02]"
              >
                <span>Mở Google Calendar xem lịch ngay</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={onReset}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Nhập lịch khác
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {syncStatus !== 'success' && (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleStartImportClick}
              disabled={
                syncStatus === 'authorizing' ||
                syncStatus === 'creating_calendar' ||
                syncStatus === 'inserting_events'
              }
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {clientId
                  ? 'Import vào Google Calendar'
                  : 'Cài đặt Client ID & Import Google'}
              </span>
            </button>

            {!clientId && (
              <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Chưa lưu Client ID (sẽ mở cài đặt)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Secondary Export Option: .ics file download */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs">
              2
            </span>
            Tải file .ics (iCalendar chuẩn)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Không cần Google Cloud Project hay tài khoản OAuth. Tải file về máy và nhấp đúp để mở trong Google Calendar, Apple Calendar (Mac/iPhone) hoặc Outlook.
          </p>
        </div>

        <button
          onClick={handleDownloadIcs}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm"
        >
          {downloadedIcs ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Đã tải file .ics thành công!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-600" />
              <span>Tải file .ics ({selectedEvents.length} môn)</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrevStep}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại xem trước</span>
        </button>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Dữ liệu xử lý hoàn toàn tại máy của bạn (Client-side)</span>
        </div>
      </div>

      {/* TMU Email Confirmation Modal */}
      <EmailPromptModal
        isOpen={isEmailModalOpen}
        initialEmail={userEmail}
        onClose={() => setIsEmailModalOpen(false)}
        onConfirm={handleEmailConfirmed}
      />
    </div>
  );
};
