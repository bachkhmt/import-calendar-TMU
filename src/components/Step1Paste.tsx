import React from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  User,
} from 'lucide-react';
import type { ParsedWeek, Weekday } from '../core/types';
import { SAMPLE_PEOPLESOFT_WEEK_1, SAMPLE_PEOPLESOFT_WEEK_2 } from '../core/sample-data';

interface Step1PasteProps {
  weeks: ParsedWeek[];
  activeWeekIndex: number;
  onUpdateWeekText: (index: number, text: string) => void;
  onAddWeek: () => void;
  onRemoveWeek: (index: number) => void;
  onSelectWeek: (index: number) => void;
  onNextStep: () => void;
}

const weekdayNames: Record<Weekday, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật',
};

export const Step1Paste: React.FC<Step1PasteProps> = ({
  weeks,
  activeWeekIndex,
  onUpdateWeekText,
  onAddWeek,
  onRemoveWeek,
  onSelectWeek,
  onNextStep,
}) => {
  const currentWeek = weeks[activeWeekIndex] || {
    weekOfMonday: '',
    events: [],
    rawText: '',
  };

  const handlePasteSampleWeek1 = () => {
    onUpdateWeekText(activeWeekIndex, SAMPLE_PEOPLESOFT_WEEK_1);
  };

  const handlePasteSampleWeek2 = () => {
    // If only 1 week exists and it's already week 1, add week 2
    if (weeks.length === 1 && currentWeek.events.length > 0) {
      onAddWeek();
      setTimeout(() => {
        onUpdateWeekText(1, SAMPLE_PEOPLESOFT_WEEK_2);
      }, 50);
    } else {
      onUpdateWeekText(activeWeekIndex, SAMPLE_PEOPLESOFT_WEEK_2);
    }
  };

  const totalEventsAcrossWeeks = weeks.reduce(
    (sum, w) => sum + w.events.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Bước 1: Dán lịch học PeopleSoft
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Mở trang <strong>My Weekly Schedule</strong> trên PeopleSoft &gt; nhấn{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
              Ctrl + A
            </kbd>{' '}
            &gt;{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
              Ctrl + C
            </kbd>{' '}
            rồi dán nguyên văn vào khung bên dưới.
          </p>
        </div>

        {/* Quick Sample Loader Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handlePasteSampleWeek1}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Dán mẫu Tuần 1 (TMU Fall)
          </button>
          <button
            onClick={handlePasteSampleWeek2}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
            title="Thêm tuần 2 để thử tính năng phát hiện đổi phòng / khuyết buổi"
          >
            + Thêm mẫu Tuần 2
          </button>
        </div>
      </div>

      {/* Multi-week Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {weeks.map((w, idx) => (
            <div
              key={idx}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                idx === activeWeekIndex
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => onSelectWeek(idx)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {w.weekOfMonday
                  ? `Tuần ${w.weekOfMonday}`
                  : `Tuần ${idx + 1}`}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  idx === activeWeekIndex
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {w.events.length} môn
              </span>
              {weeks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveWeek(idx);
                  }}
                  className="opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
                  title="Xoá tuần này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={onAddWeek}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm tuần khác
          </button>
        </div>

        {/* Total stats */}
        <div className="text-xs text-slate-500 font-medium">
          Đang xem tuần {activeWeekIndex + 1}/{weeks.length} (Tổng:{' '}
          <strong className="text-slate-800">{totalEventsAcrossWeeks}</strong> buổi)
        </div>
      </div>

      {/* Main Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="font-semibold text-slate-700">
            Nội dung sao chép từ PeopleSoft (kể cả tab / xuống dòng):
          </label>
          {currentWeek.rawText && (
            <button
              onClick={() => onUpdateWeekText(activeWeekIndex, '')}
              className="text-rose-500 hover:underline"
            >
              Xóa ô nhập
            </button>
          )}
        </div>
        <textarea
          rows={10}
          value={currentWeek.rawText || ''}
          onChange={(e) => onUpdateWeekText(activeWeekIndex, e.target.value)}
          placeholder={`Dán văn bản sao chép tại đây...\nVí dụ:\nWeek of 9/7/2026 - 9/13/2026\nTime\tMonday\nSep 7\tTuesday\nSep 8...\n8:00AM\t \tFIN 501 - 011\nInvestment Analysis\nLecture\n8:00AM - 11:00AM\nPodium 372\n...`}
          className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Parsing Status Banner */}
      {currentWeek.rawText ? (
        currentWeek.events.length > 0 ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Nhận diện thành công {currentWeek.events.length} buổi học trong tuần
                </span>
                {currentWeek.weekOfMonday && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                    Bắt đầu: {currentWeek.weekOfMonday}
                  </span>
                )}
              </div>
            </div>

            {/* Mini preview cards of parsed courses in this week */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {currentWeek.events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {ev.code}
                    </span>
                    <span className="text-emerald-700 font-medium text-[11px]">
                      {weekdayNames[ev.weekday]}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 line-clamp-1" title={ev.title}>
                    {ev.title}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      {String(ev.startTime[0]).padStart(2, '0')}:
                      {String(ev.startTime[1]).padStart(2, '0')} -{' '}
                      {String(ev.endTime[0]).padStart(2, '0')}:
                      {String(ev.endTime[1]).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                  {ev.instructors.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] truncate">
                      <User className="w-3 h-3 shrink-0" />
                      <span>{ev.instructors.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Chưa tìm thấy môn học nào</p>
              <p className="text-xs text-amber-700 mt-1">
                Hãy chắc chắn rằng bạn đã sao chép bảng lịch từ mục "Weekly Schedule View".
                Định dạng mã môn thường là <code>FIN 501 - 011</code> hoặc <code>CECN 702 - 310</code>.
                Bạn có thể bấm nút "Dán mẫu Tuần 1" bên trên để thử nghiệm ngay.
              </p>
            </div>
          </div>
        )
      ) : null}

      {/* Navigation footer */}
      <div className="flex items-center justify-end pt-4">
        <button
          onClick={onNextStep}
          disabled={totalEventsAcrossWeeks === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
            totalEventsAcrossWeeks > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-[1.01]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Tiếp tục: Cấu hình kỳ học</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
