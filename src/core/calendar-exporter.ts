import type {
  RecurringEvent,
  SemesterConfig,
} from './types';
import {
  formatLocalDate,
  formatICalLocal,
  formatICalUntilUtc,
} from './recurrence';

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  location: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence: string[];
}

/**
 * Escape text for iCalendar format (RFC 5545)
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Converts a RecurringEvent into a Google Calendar Event API payload
 */
export function buildGoogleCalendarEvent(
  event: RecurringEvent,
  config: SemesterConfig
): GoogleCalendarEventPayload {
  const startDateStr = formatLocalDate(event.rangeStart);
  const startHourStr = String(event.startTime[0]).padStart(2, '0');
  const startMinStr = String(event.startTime[1]).padStart(2, '0');
  const endHourStr = String(event.endTime[0]).padStart(2, '0');
  const endMinStr = String(event.endTime[1]).padStart(2, '0');

  const startDateTime = `${startDateStr}T${startHourStr}:${startMinStr}:00`;
  const endDateTime = `${startDateStr}T${endHourStr}:${endMinStr}:00`;

  const untilUtc = formatICalUntilUtc(event.rangeEnd);
  const recurrence: string[] = [`RRULE:FREQ=WEEKLY;UNTIL=${untilUtc}`];

  if (event.excludedDates.length > 0) {
    const exdateList = event.excludedDates.map((d) =>
      formatICalLocal(d, event.startTime)
    );
    recurrence.push(`EXDATE;TZID=${config.timeZone}:${exdateList.join(',')}`);
  }

  const instructorsText =
    event.instructors.length > 0
      ? event.instructors.join(', ')
      : 'Không có thông tin';

  return {
    summary: `${event.code} - ${event.title} (${event.type})`,
    description: `Section: ${event.section}\nLoại: ${event.type}\nGiảng viên: ${instructorsText}\nPhòng: ${event.location}`,
    location: event.location,
    start: {
      dateTime: startDateTime,
      timeZone: config.timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: config.timeZone,
    },
    recurrence,
  };
}

/**
 * Exports all selected recurring events to a standard .ics (iCalendar RFC 5545) string
 */
export function buildICalendarString(
  events: RecurringEvent[],
  config: SemesterConfig
): string {
  const selectedEvents = events.filter((e) => e.selected);
  const now = new Date();
  const nowUtcStr = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeopleSoft to Google Calendar Tool//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(config.calendarName || 'TKB Học Kỳ')}`,
    `X-WR-TIMEZONE:${config.timeZone}`,
  ];

  for (const ev of selectedEvents) {
    const uid = `${ev.id}_${now.getTime()}@peoplesoft-calendar`;
    const dtstart = formatICalLocal(ev.rangeStart, ev.startTime);
    const dtend = formatICalLocal(ev.rangeStart, ev.endTime);
    const untilUtc = formatICalUntilUtc(ev.rangeEnd);

    const instructorsText =
      ev.instructors.length > 0
        ? ev.instructors.join(', ')
        : 'N/A';
    const description = `Section: ${ev.section}\nLoại: ${ev.type}\nGiảng viên: ${instructorsText}\nPhòng: ${ev.location}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowUtcStr}`);
    lines.push(`SUMMARY:${escapeICalText(`${ev.code} - ${ev.title} (${ev.type})`)}`);
    lines.push(`DESCRIPTION:${escapeICalText(description)}`);
    lines.push(`LOCATION:${escapeICalText(ev.location)}`);
    lines.push(`DTSTART;TZID=${config.timeZone}:${dtstart}`);
    lines.push(`DTEND;TZID=${config.timeZone}:${dtend}`);
    lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${untilUtc}`);

    if (ev.excludedDates.length > 0) {
      const exdateList = ev.excludedDates.map((d) =>
        formatICalLocal(d, ev.startTime)
      );
      lines.push(`EXDATE;TZID=${config.timeZone}:${exdateList.join(',')}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
