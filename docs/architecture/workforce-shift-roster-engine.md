# Shift & Roster Scheduling Engine

## Cross-Midnight Logic
When `crossesMidnight` is true:
- Shift instances compute `endAt` by adding 1 calendar day to the start date before setting local hours.
- Rest period validations enforce minimum buffer times between consecutive shift instances.
- Shift assignments atomically check for overlapping shift windows for the same worker to prevent double-booking.
