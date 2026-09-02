import { describe, it, expect } from 'vitest';
import { parsePeopleSoftWeeklySchedule, parseTimeString } from '../parser';

const sampleScheduleRawText = `nguyen, sylvia
My Class Schedule
Select Display Option
List View
Weekly Schedule View
Campus Map
Group box
Week of 9/7/2026 - 9/13/2026
Refresh Calendar
09/07/2026
Calendar Show Week of
8:00AM
9:00PM
Show Week of
Start Time
End Time
Schedule
Time\tMonday
Sep 7\tTuesday
Sep 8\tWednesday
Sep 9\tThursday
Sep 10\tFriday
Sep 11\tSaturday
Sep 12\tSunday
Sep 13
8:00AM\t \tFIN 501 - 011
Investment Analysis
Lecture
8:00AM - 11:00AM
Podium 372
Instructors:
Yuce, Ayse (Ashley)\t \t \t \t \t 
9:00AM\t \t \t \t \t \t 
10:00AM\t \t \t \t \t \t 
11:00AM\t \t \t \t \t \t 
12:00PM\t \t \t \tECN 726 - 011
Econ of Developing Countries
Lecture
12:00PM - 3:00PM
Sally Horsfall Eaton Centre 651
Instructors:
Li, Nicholas\t \t \t 
...
6:00PM\t \t \tCECN 702 - 310
Econometrics II
Lecture
6:00PM - 10:00PM
Virtual VIRTUAL
Instructors:
Cheng, Bowen\tCECN 600 - 410
Intermediate Macroeconomics II
Lecture
6:00PM - 10:00PM
Virtual VIRTUAL
Instructors:
Baghbanferdows, Alireza\t \t \t 
...
Weekly Schedule
Display Options Collapsible section Display Options 
Show AM/PM
Monday
...
Printer Friendly Page`;

describe('PeopleSoft Weekly Schedule Parser', () => {
  it('parses time strings accurately', () => {
    expect(parseTimeString('8:00AM')).toEqual([8, 0]);
    expect(parseTimeString('11:00AM')).toEqual([11, 0]);
    expect(parseTimeString('12:00PM')).toEqual([12, 0]);
    expect(parseTimeString('3:00PM')).toEqual([15, 0]);
    expect(parseTimeString('6:00PM')).toEqual([18, 0]);
    expect(parseTimeString('10:00PM')).toEqual([22, 0]);
    expect(parseTimeString('12:00AM')).toEqual([0, 0]);
  });

  it('correctly parses the prompt sample text with 4 courses', () => {
    const result = parsePeopleSoftWeeklySchedule(sampleScheduleRawText);

    expect(result.weekOfMonday).toBe('2026-09-07');
    expect(result.events.length).toBe(4);

    // 1. FIN 501
    const fin501 = result.events.find((e) => e.code === 'FIN 501');
    expect(fin501).toBeDefined();
    expect(fin501?.section).toBe('011');
    expect(fin501?.title).toBe('Investment Analysis');
    expect(fin501?.type).toBe('Lecture');
    expect(fin501?.weekday).toBe(2); // Tuesday
    expect(fin501?.startTime).toEqual([8, 0]);
    expect(fin501?.endTime).toEqual([11, 0]);
    expect(fin501?.location).toBe('Podium 372');
    expect(fin501?.instructors).toContain('Yuce, Ayse (Ashley)');

    // 2. ECN 726
    const ecn726 = result.events.find((e) => e.code === 'ECN 726');
    expect(ecn726).toBeDefined();
    expect(ecn726?.section).toBe('011');
    expect(ecn726?.title).toBe('Econ of Developing Countries');
    expect(ecn726?.type).toBe('Lecture');
    expect(ecn726?.weekday).toBe(4); // Thursday
    expect(ecn726?.startTime).toEqual([12, 0]);
    expect(ecn726?.endTime).toEqual([15, 0]);
    expect(ecn726?.location).toBe('Sally Horsfall Eaton Centre 651');
    expect(ecn726?.instructors).toContain('Li, Nicholas');

    // 3. CECN 702
    const cecn702 = result.events.find((e) => e.code === 'CECN 702');
    expect(cecn702).toBeDefined();
    expect(cecn702?.section).toBe('310');
    expect(cecn702?.title).toBe('Econometrics II');
    expect(cecn702?.type).toBe('Lecture');
    expect(cecn702?.weekday).toBe(3); // Wednesday
    expect(cecn702?.startTime).toEqual([18, 0]);
    expect(cecn702?.endTime).toEqual([22, 0]);
    expect(cecn702?.location).toBe('Virtual VIRTUAL');
    expect(cecn702?.instructors).toContain('Cheng, Bowen');

    // 4. CECN 600
    const cecn600 = result.events.find((e) => e.code === 'CECN 600');
    expect(cecn600).toBeDefined();
    expect(cecn600?.section).toBe('410');
    expect(cecn600?.title).toBe('Intermediate Macroeconomics II');
    expect(cecn600?.type).toBe('Lecture');
    expect(cecn600?.weekday).toBe(4); // Thursday
    expect(cecn600?.startTime).toEqual([18, 0]);
    expect(cecn600?.endTime).toEqual([22, 0]);
    expect(cecn600?.location).toBe('Virtual VIRTUAL');
    expect(cecn600?.instructors).toContain('Baghbanferdows, Alireza');
  });
});
