import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Settings,
  ListChecks,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type {
  ParsedWeek,
  SemesterConfig,
  RecurringEvent,
} from './core/types';
import { parsePeopleSoftWeeklySchedule } from './core/parser';
import { mergeParsedWeeks } from './core/merger';
import { buildRecurringEvents } from './core/recurrence';
import { getSavedClientId } from './core/google-auth';
import { Navbar } from './components/Navbar';
import { OAuthHelpModal } from './components/OAuthHelpModal';
import { Step1Paste } from './components/Step1Paste';
import { Step2Config } from './components/Step2Config';
import { Step3Preview } from './components/Step3Preview';
import { Step4Export } from './components/Step4Export';

export function App() {
  // Step state (1..4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Weeks state (can have 1 or more parsed weeks)
  const [weeks, setWeeks] = useState<ParsedWeek[]>([
    { weekOfMonday: '', events: [], rawText: '' },
  ]);
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  // Google OAuth Client ID state
  const [clientId, setClientId] = useState('');
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);

  // Initialize client ID from localStorage and detect default timezone
  useEffect(() => {
    setClientId(getSavedClientId());
  }, []);

  const defaultTimezone = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz || 'America/Toronto';
    } catch {
      return 'America/Toronto';
    }
  }, []);

  // Semester Config state
  const [config, setConfig] = useState<SemesterConfig>({
    semesterStart: '',
    semesterEnd: '',
    timeZone: defaultTimezone,
    calendarName: 'TKB Học Kỳ',
    breaks: [],
  });

  // User-modified recurring events state
  const [userEventOverrides, setUserEventOverrides] = useState<
    Record<string, Partial<RecurringEvent>>
  >({});

  // Merge weeks and compute alerts
  const mergeResult = useMemo(() => {
    return mergeParsedWeeks(weeks);
  }, [weeks]);

  // Update default dates when first week is parsed
  useEffect(() => {
    const firstWeek = weeks.find((w) => w.weekOfMonday);
    if (firstWeek && firstWeek.weekOfMonday && !config.semesterStart) {
      const start = new Date(firstWeek.weekOfMonday);
      // Guess end date as ~14 weeks later (e.g. early December for Fall)
      const end = new Date(start.getTime() + 14 * 7 * 86400000);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      setConfig((prev) => ({
        ...prev,
        semesterStart: firstWeek.weekOfMonday,
        semesterEnd: prev.semesterEnd || fmt(end),
        calendarName:
          prev.calendarName === 'TKB Học Kỳ'
            ? `TKB Fall ${start.getFullYear()}`
            : prev.calendarName,
      }));
    }
  }, [weeks]);

  // Compute recurring events from merged events + config
  const recurringEvents: RecurringEvent[] = useMemo(() => {
    if (!config.semesterStart || !config.semesterEnd) return [];
    const baseRecurring = buildRecurringEvents(
      mergeResult.events,
      config,
      mergeResult.allObservedWeeks
    );

    // Apply any local user overrides (e.g. selection toggle, title, location edit)
    return baseRecurring.map((ev) => {
      const override = userEventOverrides[ev.id];
      if (override) {
        return { ...ev, ...override };
      }
      return ev;
    });
  }, [mergeResult, config, userEventOverrides]);

  // Handlers for Step 1
  const handleUpdateWeekText = (index: number, text: string) => {
    const parsed = parsePeopleSoftWeeklySchedule(text);
    setWeeks((prev) => {
      const next = [...prev];
      next[index] = parsed;
      return next;
    });
  };

  const handleAddWeek = () => {
    setWeeks((prev) => [
      ...prev,
      { weekOfMonday: '', events: [], rawText: '' },
    ]);
    setActiveWeekIndex(weeks.length);
  };

  const handleRemoveWeek = (index: number) => {
    if (weeks.length <= 1) return;
    setWeeks((prev) => prev.filter((_, i) => i !== index));
    setActiveWeekIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
  };

  // Handlers for Step 3
  const handleToggleSelectEvent = (id: string) => {
    const current = recurringEvents.find((e) => e.id === id);
    const newSelected = current ? !current.selected : true;
    setUserEventOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), selected: newSelected },
    }));
  };

  const handleSelectAllEvents = (select: boolean) => {
    const newOverrides: Record<string, Partial<RecurringEvent>> = {};
    for (const ev of recurringEvents) {
      newOverrides[ev.id] = { ...(userEventOverrides[ev.id] || {}), selected: select };
    }
    setUserEventOverrides(newOverrides);
  };

  const handleUpdateEvent = (id: string, updates: Partial<RecurringEvent>) => {
    setUserEventOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates },
    }));
  };

  // Full reset
  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn làm mới toàn bộ dữ liệu đã nhập?')) {
      setWeeks([{ weekOfMonday: '', events: [], rawText: '' }]);
      setActiveWeekIndex(0);
      setUserEventOverrides({});
      setCurrentStep(1);
    }
  };

  const stepList = [
    { number: 1, label: 'Dán TKB', icon: FileText },
    { number: 2, label: 'Cấu hình Học kỳ', icon: Settings },
    { number: 3, label: 'Xem trước Môn', icon: ListChecks },
    { number: 4, label: 'Xuất Calendar', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        hasClientId={Boolean(clientId)}
        onOpenOAuthModal={() => setIsOAuthModalOpen(true)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Wizard Stepper */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {stepList.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.number;
              const isPast = currentStep > s.number;

              return (
                <button
                  key={s.number}
                  disabled={s.number > currentStep + 1}
                  onClick={() => {
                    if (s.number <= currentStep || s.number === currentStep + 1) {
                      setCurrentStep(s.number as 1 | 2 | 3 | 4);
                    }
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2 sm:py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : isPast
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-extrabold ${
                      isActive
                        ? 'bg-white text-indigo-600'
                        : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.number}
                  </div>
                  <Icon className="w-4 h-4 hidden sm:block shrink-0" />
                  <span className="truncate text-center">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Step1Paste
            weeks={weeks}
            activeWeekIndex={activeWeekIndex}
            onUpdateWeekText={handleUpdateWeekText}
            onAddWeek={handleAddWeek}
            onRemoveWeek={handleRemoveWeek}
            onSelectWeek={setActiveWeekIndex}
            onNextStep={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Config
            config={config}
            onChangeConfig={setConfig}
            alerts={mergeResult.alerts}
            onPrevStep={() => setCurrentStep(1)}
            onNextStep={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Preview
            recurringEvents={recurringEvents}
            onToggleSelect={handleToggleSelectEvent}
            onSelectAll={handleSelectAllEvents}
            onUpdateEvent={handleUpdateEvent}
            onPrevStep={() => setCurrentStep(2)}
            onNextStep={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Export
            recurringEvents={recurringEvents}
            config={config}
            clientId={clientId}
            onOpenOAuthModal={() => setIsOAuthModalOpen(true)}
            onPrevStep={() => setCurrentStep(3)}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 mt-12 bg-white">
        <p>
          PeopleSoft Schedule to Google Calendar &bull; Client-Side Only &bull; Không lưu trữ dữ liệu người dùng
        </p>
      </footer>

      {/* OAuth Help Modal */}
      <OAuthHelpModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        onSaved={(id) => setClientId(id)}
      />
    </div>
  );
}

export default App;
