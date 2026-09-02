export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday, 7 = Sunday

export interface CourseEvent {
  id: string; // stable hash e.g. `${code}_${section}_${weekday}_${startHour}:${startMinute}`
  code: string; // e.g. "FIN 501"
  section: string; // e.g. "011"
  title: string; // e.g. "Investment Analysis"
  type: string; // e.g. "Lecture", "Lab", "Tutorial"
  weekday: Weekday; // 1 = Monday ... 7 = Sunday
  startTime: [number, number]; // [hour, minute] 24h
  endTime: [number, number]; // [hour, minute] 24h
  location: string; // e.g. "Podium 372" | "Virtual VIRTUAL"
  instructors: string[];
  observedWeeks: string[]; // ISO date string 'YYYY-MM-DD' of the Monday of weeks where this event appeared
}

export interface ParsedWeek {
  weekOfMonday: string; // 'YYYY-MM-DD'
  events: CourseEvent[];
  rawText?: string;
}

export interface BreakInterval {
  id: string;
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
}

export interface SemesterConfig {
  semesterStart: string; // 'YYYY-MM-DD'
  semesterEnd: string; // 'YYYY-MM-DD'
  timeZone: string; // e.g. 'America/Toronto'
  calendarName: string;
  breaks: BreakInterval[];
}

export interface RecurringEvent {
  id: string;
  code: string;
  section: string;
  title: string;
  type: string;
  weekday: Weekday;
  startTime: [number, number];
  endTime: [number, number];
  location: string;
  instructors: string[];
  rangeStart: Date; // first occurrence date
  rangeEnd: Date; // semester end date
  excludedDates: Date[]; // list of dates to exclude (holiday, break, or missing weeks)
  selected: boolean;
}

export interface ConflictAlert {
  type: 'room_change' | 'time_change' | 'missing_week' | 'info';
  courseId: string;
  courseCode: string;
  message: string;
  details?: {
    week: string;
    oldValue?: string;
    newValue?: string;
  };
}

export interface GoogleCalendarInsertResult {
  calendarId: string;
  calendarSummary: string;
  calendarUrl: string;
  successCount: number;
  failedCount: number;
  results: {
    courseCode: string;
    title: string;
    success: boolean;
    eventId?: string;
    error?: string;
  }[];
}
