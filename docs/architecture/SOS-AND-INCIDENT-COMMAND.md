# Emergency SOS & Incident Command System

## Architecture
- **Idempotent SOS Ingestion**: Guards against mobile retry storm within 60s windows.
- **Command Handover**: Incident Command Transfer preserves historical command periods without overwriting previous commanders.
- **Timeline Immutability**: All timeline entries are append-only.
