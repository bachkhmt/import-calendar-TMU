import { describe, it, expect } from 'vitest';
import { mergeParsedWeeks } from '../merger';
import type { ParsedWeek, CourseEvent } from '../types';

describe('Schedule Merger & Anomaly Detector', () => {
  const baseEvent: CourseEvent = {
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

  it('merges single week without conflicts', () => {
    const week1: ParsedWeek = {
      weekOfMonday: '2026-09-07',
      events: [baseEvent],
    };

    const result = mergeParsedWeeks([week1]);
    expect(result.events.length).toBe(1);
    expect(result.alerts.length).toBe(0);
    expect(result.allObservedWeeks).toEqual(['2026-09-07']);
    expect(result.events[0].observedWeeks).toEqual(['2026-09-07']);
  });

  it('detects room change between weeks', () => {
    const week1: ParsedWeek = {
      weekOfMonday: '2026-09-07',
      events: [baseEvent],
    };

    const week2Event: CourseEvent = {
      ...baseEvent,
      location: 'ENG 103', // room changed!
      observedWeeks: ['2026-09-14'],
    };

    const week2: ParsedWeek = {
      weekOfMonday: '2026-09-14',
      events: [week2Event],
    };

    const result = mergeParsedWeeks([week1, week2]);
    expect(result.events.length).toBe(1);
    expect(result.allObservedWeeks).toEqual(['2026-09-07', '2026-09-14']);
    expect(result.events[0].observedWeeks).toEqual(['2026-09-07', '2026-09-14']);

    // Alert should be generated
    const roomAlert = result.alerts.find((a) => a.type === 'room_change');
    expect(roomAlert).toBeDefined();
    expect(roomAlert?.courseCode).toBe('FIN 501');
    expect(roomAlert?.details?.oldValue).toBe('Podium 372');
    expect(roomAlert?.details?.newValue).toBe('ENG 103');
  });

  it('detects missing week for a course', () => {
    const week1: ParsedWeek = {
      weekOfMonday: '2026-09-07',
      events: [
        baseEvent,
        {
          id: 'ECN 726_011_4_12:00',
          code: 'ECN 726',
          section: '011',
          title: 'Econ of Dev',
          type: 'Lecture',
          weekday: 4,
          startTime: [12, 0],
          endTime: [15, 0],
          location: 'Sally Horsfall 651',
          instructors: [],
          observedWeeks: ['2026-09-07'],
        },
      ],
    };

    // Week 2 only has ECN 726, FIN 501 is missing!
    const week2: ParsedWeek = {
      weekOfMonday: '2026-09-14',
      events: [
        {
          id: 'ECN 726_011_4_12:00',
          code: 'ECN 726',
          section: '011',
          title: 'Econ of Dev',
          type: 'Lecture',
          weekday: 4,
          startTime: [12, 0],
          endTime: [15, 0],
          location: 'Sally Horsfall 651',
          instructors: [],
          observedWeeks: ['2026-09-14'],
        },
      ],
    };

    const result = mergeParsedWeeks([week1, week2]);
    expect(result.events.length).toBe(2);

    const missingAlert = result.alerts.find((a) => a.type === 'missing_week');
    expect(missingAlert).toBeDefined();
    expect(missingAlert?.courseCode).toBe('FIN 501');
    expect(missingAlert?.details?.week).toContain('2026-09-14');
  });
});
