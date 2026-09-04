# ADR 052: Business Calendar Mathematics and Operating Hour Intervals

## Context

Standard clock-time SLA calculations fail when operations do not run 24/7. A 4-hour SLA submitted at 4:30 PM on a Friday must not breach on Friday evening; it must resume Monday morning at 9:00 AM.

## Decision

We implement a Business Calendar mathematics engine:

1. **Configurable Working Parameters**: Business calendars define working days of week (`workingDays: [1,2,3,4,5]`), daily operating hours intervals (`workingHours: { start: "09:00", end: "17:00" }`), statutory holidays (`holidays: ["2026-12-25"]`), and custom exceptions.
2. **Interval-Based Timeline Advancement**: Adding business duration advances strictly through active operating windows, fast-forwarding non-working hours, weekends, and holidays to calculate the exact UTC deadline (`dueAt`).
3. **Clock-Time Option**: Policies can toggle `useBusinessHours: false` for 24/7 calendar clock metrics.

## Consequences

- **Positive**: Highly accurate enterprise SLA commitments reflecting actual operating hours across different regional societies.
- **Negative**: Adds small computational step traversal when projecting long durations across multiple years.
