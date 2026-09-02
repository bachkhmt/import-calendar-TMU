import type {
  CourseEvent,
  RecurringEvent,
  SemesterConfig,
  Weekday,
} from './types';

/**
 * Converts a JS Date to Weekday (1 = Monday, 7 = Sunday)
 */
export function getWeekdayFromDate(d: Date): Weekday {
  const day = d.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/**
 * Parse YYYY-MM-DD string into a local Date at midnight
 */
export function parseLocalDate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map((v) => parseInt(v, 10));
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format date and time into iCalendar local timestamp: YYYYMMDDTHHMMSS
 */
export function formatICalLocal(d: Date, [hour, minute]: [number, number]): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}00`;
}

/**
 * Format a date to UTC UNTIL string: YYYYMMDDTHHMMSSZ
 */
export function formatICalUntilUtc(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}T235959Z`;
}

/**
 * Computes the first date on or after `startDate` that falls on `targetWeekday`.
 */
export function getFirstOccurrenceDate(
  startDate: Date,
  targetWeekday: Weekday
): Date {
  const currentWk = getWeekdayFromDate(startDate);
  const diffDays = (targetWeekday - currentWk + 7) % 7;
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + diffDays);
  return result;
}

/**
 * Computes all occurrences between `firstDate` and `rangeEnd` that fall into breaks
 * or specific missing weeks.
 */
export function calculateExcludedDates(
  firstDate: Date,
  rangeEnd: Date,
  config: SemesterConfig,
  event: CourseEvent,
  allObservedWeeks?: string[]
): Date[] {
  const excluded: Date[] = [];
  const curr = new Date(firstDate.getTime());

  // Loop week-by-week
  while (curr <= rangeEnd) {
    const currStr = formatLocalDate(curr);

    // 1. Check if curr falls within any BreakInterval
    let isBreak = false;
    for (const b of config.breaks) {
      if (currStr >= b.startDate && currStr <= b.endDate) {
        isBreak = true;
        break;
      }
    }

    // 2. Check if this week was observed by parser but this event was missing
    let isMissingObservedWeek = false;
    if (allObservedWeeks && allObservedWeeks.length > 1) {
      // Find the Monday of the current week
      const currentMonday = new Date(curr.getTime());
      const wk = getWeekdayFromDate(curr);
      currentMonday.setDate(currentMonday.getDate() - (wk - 1));
      const mondayStr = formatLocalDate(currentMonday);

      if (
        allObservedWeeks.includes(mondayStr) &&
        !event.observedWeeks.includes(mondayStr)
      ) {
        isMissingObservedWeek = true;
      }
    }

    if (isBreak || isMissingObservedWeek) {
      excluded.push(new Date(curr.getTime()));
    }

    // Advance 7 days
    curr.setDate(curr.getDate() + 7);
  }

  return excluded;
}

/**
 * Builds RecurringEvent list from CourseEvents and SemesterConfig.
 */
export function buildRecurringEvents(
  events: CourseEvent[],
  config: SemesterConfig,
  allObservedWeeks?: string[]
): RecurringEvent[] {
  const startDate = parseLocalDate(config.semesterStart);
  const endDate = parseLocalDate(config.semesterEnd);

  return events.map((event) => {
    const firstDate = getFirstOccurrenceDate(startDate, event.weekday);
    const excludedDates = calculateExcludedDates(
      firstDate,
      endDate,
      config,
      event,
      allObservedWeeks
    );

    return {
      id: event.id,
      code: event.code,
      section: event.section,
      title: event.title,
      type: event.type,
      weekday: event.weekday,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      instructors: event.instructors,
      rangeStart: firstDate,
      rangeEnd: endDate,
      excludedDates,
      selected: true,
    };
  });
}
