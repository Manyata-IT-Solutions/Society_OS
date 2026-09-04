# ADR 070: Concurrency-Safe Technician Self-Claim and Dispatch

## Status

Accepted

## Context

In a busy facility department, multiple technicians may view the unassigned team queue simultaneously. Two technicians might click "Self-Claim" on the same urgent work order at the exact same fraction of a second.

## Decision

1. **Optimistic Concurrency & Atomic Claim**: The claim method checks `primaryAssigneeId`. If already set to a different technician, it throws `409 Conflict`.
2. **Assignment Audit**: An immutable `WorkOrderAssignmentHistory` record is appended within the transaction capturing `fromUserId`, `toUserId`, `fromTeamId`, `toTeamId`, and timestamp.
3. **Workflow Integration**: On successful claim, the state automatically transitions to `ACCEPTED` with `isAccepted = true` and `acceptedAt = now()`.

## Consequences

- Race-condition free self-assignment in high-volume team queues.
- Complete traceability of dispatch and assignment history.
