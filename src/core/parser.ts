import type { CourseEvent, ParsedWeek, Weekday } from './types';

/**
 * Parses time string like "8:00AM", "12:00PM", "6:30PM" into [hour, minute] 24h
 */
export function parseTimeString(timeStr: string): [number, number] {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return [0, 0];
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return [hour, minute];
}

/**
 * Format [hour, minute] to "HH:MM"
 */
export function formatTime24([hour, minute]: [number, number]): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Extract "Week of M/D/YYYY - M/D/YYYY" from PeopleSoft raw text
 */
export function extractWeekOfMonday(text: string): string | null {
  // Try "Week of M/D/YYYY - M/D/YYYY" or "Week of MM/DD/YYYY"
  const mdyMatch = text.match(/Week\s+of\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1], 10);
    const day = parseInt(mdyMatch[2], 10);
    const year = parseInt(mdyMatch[3], 10);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Try ISO format "Week of YYYY-MM-DD"
  const isoMatch = text.match(/Week\s+of\s+(\d{4})-(\d{1,2})-(\d{1,2})/i);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Try finding a date under "Refresh Calendar\nMM/DD/YYYY"
  const refreshMatch = text.match(/Refresh Calendar\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (refreshMatch) {
    const month = parseInt(refreshMatch[1], 10);
    const day = parseInt(refreshMatch[2], 10);
    const year = parseInt(refreshMatch[3], 10);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Parses an individual course cell text into one or more CourseEvent blocks.
 */
export function parseCourseCell(
  cellText: string,
  weekday: Weekday,
  observedWeek: string
): CourseEvent[] {
  const trimmed = cellText.trim();
  if (!trimmed) return [];

  // Match course code line pattern:
  // e.g. "FIN 501 - 011", "CECN 702 - 310", "ECN 726 - 011", "CPS 109 - 01"
  const courseCodeRegex = /^([A-Z]{2,6}\s?\d{3,4})\s*-\s*([A-Za-z0-9]+)/;

  // Split cell into multiple course chunks if multiple courses are present in the same cell
  // Find all line indices that start with a course code
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim());
  const courseBlockStarts: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (courseCodeRegex.test(lines[i])) {
      courseBlockStarts.push(i);
    }
  }

  if (courseBlockStarts.length === 0) {
    return [];
  }

  const events: CourseEvent[] = [];

  for (let b = 0; b < courseBlockStarts.length; b++) {
    const startIdx = courseBlockStarts[b];
    const endIdx =
      b + 1 < courseBlockStarts.length ? courseBlockStarts[b + 1] : lines.length;
    const blockLines = lines.slice(startIdx, endIdx).filter((l) => l.length > 0);

    const firstLineMatch = blockLines[0].match(courseCodeRegex);
    if (!firstLineMatch) continue;

    const code = firstLineMatch[1].trim();
    const section = firstLineMatch[2].trim();

    let title = '';
    let type = 'Lecture';
    let startTime: [number, number] = [0, 0];
    let endTime: [number, number] = [0, 0];
    let location = 'TBA';
    const instructors: string[] = [];

    // Line 1 is code - section
    // Line 2 is usually title
    if (blockLines.length > 1) {
      title = blockLines[1];
    }

    // Find time range line: "8:00AM - 11:00AM"
    const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i;
    let timeLineIdx = -1;

    for (let i = 1; i < blockLines.length; i++) {
      const tMatch = blockLines[i].match(timeRegex);
      if (tMatch) {
        timeLineIdx = i;
        startTime = parseTimeString(tMatch[1]);
        endTime = parseTimeString(tMatch[2]);
        break;
      }
    }

    // Check if line before time line is component type (Lecture, Lab, etc.)
    if (timeLineIdx > 2) {
      type = blockLines[timeLineIdx - 1];
    } else if (timeLineIdx === 2) {
      // If line 2 was time, then title might have been empty or line 1
      type = 'Lecture';
    }

    // Common component type recognition
    const typeRegex = /^(Lecture|Lab|Laboratory|Tutorial|Seminar|Practicum|Studio|Discussion|Workshop)$/i;
    for (let i = 1; i < (timeLineIdx > 0 ? timeLineIdx : blockLines.length); i++) {
      if (typeRegex.test(blockLines[i])) {
        type = blockLines[i];
        if (i === 1) {
          // If line 1 was type, title was not line 1
          title = '';
        } else if (i > 1 && !title) {
          title = blockLines.slice(1, i).join(' ');
        }
        break;
      }
    }

    // Location is typically between timeLine and Instructors:
    let instructorsIdx = -1;
    for (let i = 1; i < blockLines.length; i++) {
      if (/^Instructors?:/i.test(blockLines[i])) {
        instructorsIdx = i;
        break;
      }
    }

    if (timeLineIdx !== -1) {
      if (instructorsIdx !== -1 && instructorsIdx > timeLineIdx + 1) {
        location = blockLines.slice(timeLineIdx + 1, instructorsIdx).join(' ');
      } else if (instructorsIdx === -1 && timeLineIdx + 1 < blockLines.length) {
        location = blockLines.slice(timeLineIdx + 1).join(' ');
      }
    }

    // Instructors
    if (instructorsIdx !== -1) {
      const instLine = blockLines[instructorsIdx].replace(/^Instructors?:\s*/i, '').trim();
      if (instLine) {
        instructors.push(instLine);
      }
      for (let i = instructorsIdx + 1; i < blockLines.length; i++) {
        const nextInst = blockLines[i].trim();
        if (nextInst) {
          instructors.push(nextInst);
        }
      }
    }

    const id = `${code}_${section}_${weekday}_${formatTime24(startTime)}`;

    events.push({
      id,
      code,
      section,
      title: title || code,
      type: type || 'Lecture',
      weekday,
      startTime,
      endTime,
      location: location || 'TBA',
      instructors: instructors.filter(Boolean),
      observedWeeks: observedWeek ? [observedWeek] : [],
    });
  }

  return events;
}

/**
 * Main parser for PeopleSoft "My Weekly Schedule" raw copied text.
 */
export function parsePeopleSoftWeeklySchedule(rawText: string): ParsedWeek {
  if (!rawText || !rawText.trim()) {
    return { weekOfMonday: '', events: [] };
  }

  const observedWeek = extractWeekOfMonday(rawText) || '';

  // Primary Parsing Strategy: Row anchors with tab-delimited columns.
  // PeopleSoft tables have rows starting with time labels like:
  // "8:00AM\t", "12:00PM\t", "6:00PM\t"
  // Each row has 8 tab columns: Time (0), Mon (1), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6), Sun (7).

  // Split text by lines while preserving structure
  const rawLines = rawText.split(/\r?\n/);
  const rowAnchorRegex = /^(\d{1,2}:\d{2}\s*(?:AM|PM))\t/;

  // Find line indices where a time row begins
  interface RowBlock {
    timeLabel: string;
    content: string;
  }

  const rowBlocks: RowBlock[] = [];
  let currentRowTime = '';
  let currentRowLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(rowAnchorRegex);

    if (match) {
      if (currentRowTime) {
        rowBlocks.push({
          timeLabel: currentRowTime,
          content: currentRowLines.join('\n'),
        });
      }
      currentRowTime = match[1];
      // Keep entire line including anchor
      currentRowLines = [line];
    } else if (currentRowTime) {
      // Check if we hit footer or end of schedule
      if (
        line.includes('Weekly Schedule') &&
        line.includes('Display Options')
      ) {
        rowBlocks.push({
          timeLabel: currentRowTime,
          content: currentRowLines.join('\n'),
        });
        currentRowTime = '';
        currentRowLines = [];
        break;
      }
      currentRowLines.push(line);
    }
  }

  if (currentRowTime) {
    rowBlocks.push({
      timeLabel: currentRowTime,
      content: currentRowLines.join('\n'),
    });
  }

  const eventMap = new Map<string, CourseEvent>();

  if (rowBlocks.length > 0) {
    // Process each row block
    for (const block of rowBlocks) {
      // Split the row by tab characters '\t'
      const columns = block.content.split('\t');

      // Column 0 is the time header (e.g. "8:00AM")
      // Columns 1..7 map to Monday..Sunday
      for (let col = 1; col <= 7 && col < columns.length; col++) {
        const cellText = columns[col];
        if (!cellText || !cellText.trim()) continue;

        const weekday = col as Weekday;
        const cellEvents = parseCourseCell(cellText, weekday, observedWeek);
        for (const ev of cellEvents) {
          if (!eventMap.has(ev.id)) {
            eventMap.set(ev.id, ev);
          }
        }
      }
    }
  }

  // Fallback: If no row blocks matched (e.g. tabs were replaced or table header parsing)
  if (eventMap.size === 0) {
    // Attempt block regex search for course blocks
    const courseRegex = /([A-Z]{2,6}\s?\d{3,4})\s*-\s*([A-Za-z0-9]+)[\r\n]+([^\r\n]+)[\r\n]+([^\r\n]+)[\r\n]+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))[\r\n]+([^\r\n]+)[\r\n]+(?:Instructors?:[\r\n]+([^\r\n\t]+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = courseRegex.exec(rawText)) !== null) {
      const code = match[1].trim();
      const section = match[2].trim();
      const title = match[3].trim();
      const type = match[4].trim();
      const startTime = parseTimeString(match[5]);
      const endTime = parseTimeString(match[6]);
      const location = match[7].trim();
      const instructor = match[8] ? match[8].trim() : '';

      // Default weekday to Monday if unknown in fallback
      const weekday: Weekday = 1;
      const id = `${code}_${section}_${weekday}_${formatTime24(startTime)}`;

      if (!eventMap.has(id)) {
        eventMap.set(id, {
          id,
          code,
          section,
          title,
          type,
          weekday,
          startTime,
          endTime,
          location,
          instructors: instructor ? [instructor] : [],
          observedWeeks: observedWeek ? [observedWeek] : [],
        });
      }
    }
  }

  return {
    weekOfMonday: observedWeek,
    events: Array.from(eventMap.values()),
    rawText,
  };
}
