import type { CourseEvent, ParsedWeek, ConflictAlert } from './types';

export interface MergeResult {
  events: CourseEvent[];
  alerts: ConflictAlert[];
  allObservedWeeks: string[]; // sorted list of all unique weekOfMonday parsed
}

/**
 * Merges multiple parsed weeks into a unified list of CourseEvents,
 * and detects discrepancies such as room changes, time changes, or missing weeks.
 */
export function mergeParsedWeeks(parsedWeeks: ParsedWeek[]): MergeResult {
  const alerts: ConflictAlert[] = [];
  const eventMap = new Map<string, CourseEvent>();
  const weekSet = new Set<string>();

  for (const week of parsedWeeks) {
    if (week.weekOfMonday) {
      weekSet.add(week.weekOfMonday);
    }
  }

  const allObservedWeeks = Array.from(weekSet).sort();

  for (const week of parsedWeeks) {
    const currentWeekMonday = week.weekOfMonday;

    for (const event of week.events) {
      if (!eventMap.has(event.id)) {
        // First time seeing this course event
        eventMap.set(event.id, {
          ...event,
          observedWeeks: currentWeekMonday ? [currentWeekMonday] : [],
        });
      } else {
        const existing = eventMap.get(event.id)!;

        // Add to observedWeeks if not already present
        if (currentWeekMonday && !existing.observedWeeks.includes(currentWeekMonday)) {
          existing.observedWeeks.push(currentWeekMonday);
          existing.observedWeeks.sort();
        }

        // Check for room changes
        if (event.location && existing.location && event.location !== existing.location) {
          alerts.push({
            type: 'room_change',
            courseId: event.id,
            courseCode: event.code,
            message: `Phát hiện đổi phòng cho môn ${event.code} (Section ${event.section}): "${existing.location}" chuyển sang "${event.location}" vào tuần ${currentWeekMonday || 'tiếp theo'}.`,
            details: {
              week: currentWeekMonday,
              oldValue: existing.location,
              newValue: event.location,
            },
          });
        }

        // Check for time changes
        const existingTimeStr = `${existing.startTime[0]}:${existing.startTime[1]} - ${existing.endTime[0]}:${existing.endTime[1]}`;
        const newTimeStr = `${event.startTime[0]}:${event.startTime[1]} - ${event.endTime[0]}:${event.endTime[1]}`;
        if (existingTimeStr !== newTimeStr) {
          alerts.push({
            type: 'time_change',
            courseId: event.id,
            courseCode: event.code,
            message: `Phát hiện đổi giờ cho môn ${event.code} (Section ${event.section}): ${existingTimeStr} thành ${newTimeStr} vào tuần ${currentWeekMonday || 'tiếp theo'}.`,
            details: {
              week: currentWeekMonday,
              oldValue: existingTimeStr,
              newValue: newTimeStr,
            },
          });
        }

        // Update instructors if existing was empty
        if (existing.instructors.length === 0 && event.instructors.length > 0) {
          existing.instructors = [...event.instructors];
        }
      }
    }
  }

  // Detect missing weeks: if multiple weeks were parsed, check if any course is missing in some weeks
  if (allObservedWeeks.length > 1) {
    for (const [id, event] of eventMap.entries()) {
      const missingWeeks = allObservedWeeks.filter(
        (w) => !event.observedWeeks.includes(w)
      );

      if (missingWeeks.length > 0 && missingWeeks.length < allObservedWeeks.length) {
        alerts.push({
          type: 'missing_week',
          courseId: id,
          courseCode: event.code,
          message: `Môn ${event.code} (${event.title}) không xuất hiện ở tuần: ${missingWeeks.join(', ')}. Tool có thể tự loại trừ các ngày này khỏi lịch lặp.`,
          details: {
            week: missingWeeks.join(', '),
          },
        });
      }
    }
  }

  return {
    events: Array.from(eventMap.values()),
    alerts,
    allObservedWeeks,
  };
}
