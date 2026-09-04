import { BusinessCalendarService } from './business-calendar.service.js';
import type { BusinessCalendar } from '@community-os/types';

describe('BusinessCalendarService', () => {
  let service: BusinessCalendarService;

  beforeEach(() => {
    service = new BusinessCalendarService();
  });

  const mockCalendar: BusinessCalendar = {
    id: 'cal-1',
    key: 'cal.standard',
    name: 'Standard Working Calendar',
    description: 'Monday-Friday 9am-5pm',
    scopeType: 'PLATFORM',
    scopeId: null,
    organizationId: null,
    communityId: null,
    timezone: 'UTC',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    workingHours: { start: '09:00', end: '17:00' }, // 8 hours (480 mins) per day
    holidays: ['2026-01-01', '2026-12-25'],
    exceptions: [],
    isDefault: true,
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should calculate direct clock time when useBusinessHours is false', () => {
    const start = new Date('2026-06-01T10:00:00.000Z');
    const due = service.calculateDueAt(start, 120, false, null); // 2 hours

    expect(due.toISOString()).toBe('2026-06-01T12:00:00.000Z');
  });

  it('should advance within the same business working day', () => {
    // Monday 10:00 AM UTC + 2 hours (120 min) -> Monday 12:00 PM UTC
    const start = new Date('2026-06-01T10:00:00.000Z');
    const due = service.calculateDueAt(start, 120, true, mockCalendar);

    expect(due.toISOString()).toBe('2026-06-01T12:00:00.000Z');
  });

  it('should roll over to next business day when duration exceeds daily operating hours', () => {
    // Monday 04:00 PM (16:00) UTC + 2 hours (120 min)
    // 1 hour remaining on Monday (16:00 - 17:00)
    // 1 hour spills over to Tuesday 09:00 -> Tuesday 10:00 AM UTC
    const start = new Date('2026-06-01T16:00:00.000Z');
    const due = service.calculateDueAt(start, 120, true, mockCalendar);

    expect(due.toISOString()).toBe('2026-06-02T10:00:00.000Z');
  });

  it('should skip weekend days (Saturday and Sunday)', () => {
    // Friday 04:00 PM (16:00) UTC (2026-06-05) + 2 hours (120 min)
    // 1 hour on Friday -> 17:00
    // Sat & Sun skipped -> 1 hour on Monday 2026-06-08 09:00 -> 10:00 AM
    const start = new Date('2026-06-05T16:00:00.000Z');
    const due = service.calculateDueAt(start, 120, true, mockCalendar);

    expect(due.toISOString()).toBe('2026-06-08T10:00:00.000Z');
  });

  it('should calculate warning threshold timestamp at 80%', () => {
    const start = new Date('2026-06-01T10:00:00.000Z');
    const due = new Date('2026-06-01T15:00:00.000Z'); // 5 hours (300 mins)

    const warning = service.calculateWarningAt(start, due, 80, false, null);
    // 300 * 0.8 = 240 mins (4 hours) -> 14:00
    expect(warning.toISOString()).toBe('2026-06-01T14:00:00.000Z');
  });
});
