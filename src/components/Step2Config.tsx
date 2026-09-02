import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  Globe,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
  Coffee,
} from 'lucide-react';
import type { SemesterConfig, ConflictAlert } from '../core/types';

interface Step2ConfigProps {
  config: SemesterConfig;
  onChangeConfig: (newConfig: SemesterConfig) => void;
  alerts: ConflictAlert[];
  onPrevStep: () => void;
  onNextStep: () => void;
}

const COMMON_TIMEZONES = [
  { value: 'America/Toronto', label: 'America/Toronto (TMU, U of T, York, McMaster - EST/EDT)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (UBC, SFU, UVic - PST/PDT)' },
  { value: 'America/Edmonton', label: 'America/Edmonton (U of Alberta, Calgary - MST/MDT)' },
  { value: 'America/Montreal', label: 'America/Montreal (McGill, Concordia - EST/EDT)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific Time)' },
  { value: 'America/Winnipeg', label: 'America/Winnipeg (U of Manitoba - CST/CDT)' },
  { value: 'America/Halifax', label: 'America/Halifax (Dalhousie - AST/ADT)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (Việt Nam - GMT+7)' },
];

export const Step2Config: React.FC<Step2ConfigProps> = ({
  config,
  onChangeConfig,
  alerts,
  onPrevStep,
  onNextStep,
}) => {
  const [newBreakName, setNewBreakName] = useState('');
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');

  const handleAddBreak = () => {
    if (!newBreakStart) return;
    const end = newBreakEnd || newBreakStart;
    const name = newBreakName.trim() || 'Kỳ nghỉ / Ngày lễ';

    onChangeConfig({
      ...config,
      breaks: [
        ...config.breaks,
        {
          id: String(Date.now()),
          name,
          startDate: newBreakStart,
          endDate: end,
        },
      ],
    });

    setNewBreakName('');
    setNewBreakStart('');
    setNewBreakEnd('');
  };

  const handleRemoveBreak = (id: string) => {
    onChangeConfig({
      ...config,
      breaks: config.breaks.filter((b) => b.id !== id),
    });
  };

  const handleAddReadingWeekPreset = () => {
    if (!config.semesterStart) return;
    // Guess reading week in October: around week 6
    const start = new Date(config.semesterStart);
    const readingStart = new Date(start.getTime() + 5 * 7 * 86400000);
    const readingEnd = new Date(readingStart.getTime() + 4 * 86400000);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    onChangeConfig({
      ...config,
      breaks: [
        ...config.breaks,
        {
          id: String(Date.now()),
          name: 'Reading Week (Tuần nghỉ giữa kỳ)',
          startDate: fmt(readingStart),
          endDate: fmt(readingEnd),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-purple-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Bước 2: Cấu hình Học kỳ, Múi giờ & Ngày nghỉ
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Hệ thống PeopleSoft không ghi sẵn ngày bắt đầu/kết thúc học kỳ. Hãy xác nhận khung thời gian bên dưới để tool sinh các sự kiện lặp hàng tuần chính xác nhất.
        </p>
      </div>

      {/* Conflict Alerts if any */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Phát hiện {alerts.length} thay đổi / điểm bất thường giữa các tuần đã dán:</span>
          </div>
          <ul className="space-y-1.5 pl-6 text-xs text-amber-800 list-disc">
            {alerts.map((a, i) => (
              <li key={i} className="leading-relaxed">
                <strong>{a.courseCode}</strong>: {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid of Main Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Semester Start & End */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Thời gian học kỳ
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu học kỳ (thường là thứ Hai tuần đầu):
              </label>
              <input
                type="date"
                value={config.semesterStart}
                onChange={(e) =>
                  onChangeConfig({ ...config, semesterStart: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày kết thúc học kỳ (buổi học cuối cùng):
              </label>
              <input
                type="date"
                value={config.semesterEnd}
                onChange={(e) =>
                  onChangeConfig({ ...config, semesterEnd: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Timezone & Calendar Name */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            Múi giờ & Tên Calendar
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Múi giờ trường / cơ sở học:
              </label>
              <select
                value={config.timeZone}
                onChange={(e) =>
                  onChangeConfig({ ...config, timeZone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Múi giờ quan trọng để Google Calendar hiển thị đúng giờ học khi bạn đi lại giữa các múi giờ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên lịch sẽ tạo trên Google Calendar:
              </label>
              <input
                type="text"
                value={config.calendarName}
                onChange={(e) =>
                  onChangeConfig({ ...config, calendarName: e.target.value })
                }
                placeholder="VD: TKB TMU Fall 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Break & Holiday Intervals Manager */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-600" />
              Danh sách Kỳ nghỉ & Ngày lễ không học (Loại trừ tự động)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các ngày trong khoảng này sẽ tự động sinh mã <code>EXDATE</code> để không xuất hiện sự kiện trên lịch.
            </p>
          </div>
          <button
            onClick={handleAddReadingWeekPreset}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            + Thêm gợi ý Reading Week
          </button>
        </div>

        {/* Existing breaks table */}
        {config.breaks.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {config.breaks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">{b.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {b.startDate} {b.startDate !== b.endDate && `đến ${b.endDate}`}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBreak(b.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Xoá kỳ nghỉ này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            Chưa có ngày nghỉ nào được thêm. Bạn có thể thêm bên dưới.
          </div>
        )}

        {/* Add new break form */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
          <div className="text-xs font-semibold text-slate-700">Thêm kỳ nghỉ mới:</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Tên kỳ nghỉ (VD: Reading Week, Thanksgiving)"
              value={newBreakName}
              onChange={(e) => setNewBreakName(e.target.value)}
              className="sm:col-span-5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              placeholder="Từ ngày"
              value={newBreakStart}
              onChange={(e) => setNewBreakStart(e.target.value)}
              className="sm:col-span-3 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              placeholder="Đến ngày"
              value={newBreakEnd}
              onChange={(e) => setNewBreakEnd(e.target.value)}
              className="sm:col-span-3 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddBreak}
              disabled={!newBreakStart}
              className={`sm:col-span-1 flex items-center justify-center p-2 rounded-lg font-semibold text-xs transition-colors ${
                newBreakStart
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Thêm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrevStep}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={!config.semesterStart || !config.semesterEnd}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
            config.semesterStart && config.semesterEnd
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-[1.01]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Tiếp tục: Xem trước toàn bộ môn</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
