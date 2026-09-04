# Workforce Identity & Employment Models

## Invariants
- `Worker` is the human master.
- `WorkerEngagement` captures the contractual relationship (`DIRECT_EMPLOYMENT` vs `VENDOR_CONTRACT`).
- A single worker can hold multiple historical engagements over time while maintaining a single immutable worker number (`WRK-YYYY-NNNNNN`).
- Offboarding a worker exits engagements, cancels pending shift assignments, and updates deployment statuses without deleting historical timesheets.
