# Attendance & Correction Architecture

## Event Append-Only Pattern
1. Check-in requests create or attach to a logical `AttendanceSession` for the date.
2. An immutable `AttendanceEvent` record is appended with timestamp, method (`MOBILE`, `RFID`, `QR`), and geofence evaluation result.
3. Multiple simultaneous check-ins (e.g. mobile app and gate RFID) link to the same daily session while preserving distinct event proofs.
4. Corrections require supervisor approval and append `MANUAL_CORRECTION` events rather than overwriting historical telemetry.
