import { describe, it, expect } from 'vitest';
import {
  getFirstOccurrenceDate,
  formatLocalDate,
  formatICalLocal,
  formatICalUntilUtc,
  calculateExcludedDates,
  buildRecurringEvents,
} from '../recurrence';
import type { CourseEvent, SemesterConfig } from '../types';

describe('Recurrence Calculations', () => {
  it('correctly calculates the first occurrence date for various weekdays', () => {
    // 2026-09-07 is Monday
    const mondayStart = new Date(2026, 8, 7); // Note: month is 0-indexed in JS (8 = Sept)

    // Monday class -> 2026-09-07
    const mon = getFirstOccurrenceDate(mondayStart, 1);
    expect(formatLocalDate(mon)).toBe('2026-09-07');

    // Tuesday class -> 2026-09-08
    const tue = getFirstOccurrenceDate(mondayStart, 2);
    expect(formatLocalDate(tue)).toBe('2026-09-08');

    // Thursday class -> 2026-09-10
    const thu = getFirstOccurrenceDate(mondayStart, 4);
    expect(formatLocalDate(thu)).toBe('2026-09-10');
  });

  it('formats iCal local and until strings accurately', () => {
    const d = new Date(2026, 8, 8); // Sep 8, 2026
    expect(formatICalLocal(d, [8, 0])).toBe('20260908T080000');
    expect(formatICalUntilUtc(d)).toBe('20260908T235959Z');
  });

  it('calculates excluded dates for holiday/break intervals', () => {
    const config: SemesterConfig = {
      semesterStart: '2026-09-07',
      semesterEnd: '2026-12-15',
      timeZone: 'America/Toronto',
      calendarName: 'Fall 2026',
      breaks: [
        {
          id: '1',
          name: 'Reading Week',
          startDate: '2026-10-12', // Monday
          endDate: '2026-10-16', // Friday
        },
      ],
    };

    const fin501: CourseEvent = {
      id: 'FIN 501_011_2_08:00',
      code: 'FIN 501',
      section: '011',
      title: 'Investment Analysis',
      type: 'Lecture',
      weekday: 2, // Tuesday
      startTime: [8, 0],
      endTime: [11, 0],
      location: 'Podium 372',
      instructors: [],
      observedWeeks: ['2026-09-07'],
    };

    const firstDate = new Date(2026, 8, 8); // Tuesday Sep 8
    const endDate = new Date(2026, 11, 15); // Dec 15

    const excluded = calculateExcludedDates(firstDate, endDate, config, fin501);

    // Tuesday in reading week is 2026-10-13
    expect(excluded.length).toBe(1);
    expect(formatLocalDate(excluded[0])).toBe('2026-10-13');
  });

  it('builds recurring events properly', () => {
    const config: SemesterConfig = {
      semesterStart: '2026-09-07',
      semesterEnd: '2026-12-15',
      timeZone: 'America/Toronto',
      calendarName: 'Fall 2026',
      breaks: [],
    };

    const fin501: CourseEvent = {
      id: 'FIN 501_011_2_08:00',
      code: 'FIN 501',
      section: '011',
      title: 'Investment Analysis',
      type: 'Lecture',
      weekday: 2,
      startTime: [8, 0],
      endTime: [11, 0],
      location: 'Podium 372',
      instructors: ['Yuce, Ayse'],
      observedWeeks: ['2026-09-07'],
    };

    const recurring = buildRecurringEvents([fin501], config);
    expect(recurring.length).toBe(1);
    expect(recurring[0].code).toBe('FIN 501');
    expect(formatLocalDate(recurring[0].rangeStart)).toBe('2026-09-08');
    expect(formatLocalDate(recurring[0].rangeEnd)).toBe('2026-12-15');
    expect(recurring[0].selected).toBe(true);
  });
});
