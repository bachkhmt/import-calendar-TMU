import React from 'react';
import {
  CheckSquare,
  Square,
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  ListChecks,
  Slash,
} from 'lucide-react';
import type { RecurringEvent, Weekday } from '../core/types';
import { formatLocalDate } from '../core/recurrence';

interface Step3PreviewProps {
  recurringEvents: RecurringEvent[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onUpdateEvent: (id: string, updates: Partial<RecurringEvent>) => void;
  onPrevStep: () => void;
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

export const Step3Preview: React.FC<Step3PreviewProps> = ({
  recurringEvents,
  onToggleSelect,
  onSelectAll,
  onUpdateEvent,
  onPrevStep,
  onNextStep,
}) => {
  const selectedCount = recurringEvents.filter((e) => e.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-emerald-600" />
            Bước 3: Xem trước & Tùy chỉnh lịch học
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Kiểm tra lại toàn bộ các buổi học sẽ được thêm vào Google Calendar. Bạn có thể bỏ chọn những môn không muốn xuất hoặc chỉnh sửa tên/phòng nếu cần.
          </p>
        </div>

        {/* Selection summary & quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectAll(true)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            Chọn tất cả ({recurringEvents.length})
          </button>
          <button
            onClick={() => onSelectAll(false)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Bỏ chọn hết
          </button>
        </div>
      </div>

      {/* Course Cards / Table */}
      <div className="space-y-3">
        {recurringEvents.map((ev) => {
          const startTimeStr = `${String(ev.startTime[0]).padStart(2, '0')}:${String(ev.startTime[1]).padStart(2, '0')}`;
          const endTimeStr = `${String(ev.endTime[0]).padStart(2, '0')}:${String(ev.endTime[1]).padStart(2, '0')}`;
          const firstDateStr = formatLocalDate(ev.rangeStart);
          const endDateStr = formatLocalDate(ev.rangeEnd);

          return (
            <div
              key={ev.id}
              className={`p-4 rounded-2xl border transition-all ${
                ev.selected
                  ? 'bg-white border-slate-300 shadow-sm hover:border-indigo-400'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Selection Checkbox */}
                <button
                  onClick={() => onToggleSelect(ev.id)}
                  className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                >
                  {ev.selected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Course Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {ev.code}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Section {ev.section}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {ev.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{weekdayNames[ev.weekday]}</span>
                    </div>
                  </div>

                  {/* Title & Editable location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Tên môn:</span>
                      <input
                        type="text"
                        value={ev.title}
                        onChange={(e) =>
                          onUpdateEvent(ev.id, { title: e.target.value })
                        }
                        className="w-full font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 -ml-2 rounded border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">Phòng học:</span>
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={ev.location}
                          onChange={(e) =>
                            onUpdateEvent(ev.id, { location: e.target.value })
                          }
                          className="w-full font-medium bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 -ml-2 rounded border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meta info row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startTimeStr} - {endTimeStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Buổi đầu: <strong>{firstDateStr}</strong> &rarr; Đến:{' '}
                        <strong>{endDateStr}</strong>
                      </span>
                    </div>

                    {ev.instructors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.instructors.join(', ')}</span>
                      </div>
                    )}

                    {ev.excludedDates.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                        <Slash className="w-3 h-3" />
                        <span>{ev.excludedDates.length} buổi nghỉ</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrevStep}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại cấu hình</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={selectedCount === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
            selectedCount > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-[1.01]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Tiếp tục: Xuất lịch ({selectedCount} môn đã chọn)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
