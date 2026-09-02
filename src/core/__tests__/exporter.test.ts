import { describe, it, expect } from 'vitest';
import {
  buildGoogleCalendarEvent,
  buildICalendarString,
} from '../calendar-exporter';
import type { RecurringEvent, SemesterConfig } from '../types';

describe('Calendar Exporter (Google API & iCalendar .ics)', () => {
  const config: SemesterConfig = {
    semesterStart: '2026-09-07',
    semesterEnd: '2026-12-15',
    timeZone: 'America/Toronto',
    calendarName: 'TKB Fall 2026',
    breaks: [],
  };

  const sampleRecurringEvent: RecurringEvent = {
    id: 'FIN 501_011_2_08:00',
    code: 'FIN 501',
    section: '011',
    title: 'Investment Analysis',
    type: 'Lecture',
    weekday: 2,
    startTime: [8, 0],
    endTime: [11, 0],
    location: 'Podium 372',
    instructors: ['Yuce, Ayse (Ashley)'],
    rangeStart: new Date(2026, 8, 8), // 2026-09-08
    rangeEnd: new Date(2026, 11, 15), // 2026-12-15
    excludedDates: [new Date(2026, 9, 13)], // 2026-10-13
    selected: true,
  };

  it('builds valid Google Calendar event payload with RRULE and EXDATE', () => {
    const payload = buildGoogleCalendarEvent(sampleRecurringEvent, config);

    expect(payload.summary).toBe('FIN 501 - Investment Analysis (Lecture)');
    expect(payload.location).toBe('Podium 372');
    expect(payload.start.dateTime).toBe('2026-09-08T08:00:00');
    expect(payload.start.timeZone).toBe('America/Toronto');
    expect(payload.end.dateTime).toBe('2026-09-08T11:00:00');
    expect(payload.end.timeZone).toBe('America/Toronto');

    expect(payload.recurrence.length).toBe(2);
    expect(payload.recurrence[0]).toBe('RRULE:FREQ=WEEKLY;UNTIL=20261215T235959Z');
    expect(payload.recurrence[1]).toBe(
      'EXDATE;TZID=America/Toronto:20261013T080000'
    );
  });

  it('builds valid RFC 5545 iCalendar (.ics) string', () => {
    const ics = buildICalendarString([sampleRecurringEvent], config);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('X-WR-CALNAME:TKB Fall 2026');
    expect(ics).toContain('X-WR-TIMEZONE:America/Toronto');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:FIN 501 - Investment Analysis (Lecture)');
    expect(ics).toContain('LOCATION:Podium 372');
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260908T080000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260908T110000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=20261215T235959Z');
    expect(ics).toContain('EXDATE;TZID=America/Toronto:20261013T080000');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});
