# ADR 066: Multi-Attempt Supervisor Review and Rework Loop

## Status

Accepted

## Context

Field execution quality in enterprise facility management requires rigorous supervisory verification. When a technician submits work completion, a facility manager or supervisor must inspect the results, verify photo proof, and either approve closure or order rework. If rework is requested, the work order must return to active execution with clear instructions, while preserving all historical completion submissions and supervisor comments.

## Decision

We implement a multi-attempt review workflow:

1. When work is submitted, state transitions to `SUPERVISOR_REVIEW`.
2. The supervisor can choose:
   - **APPROVED**: Transitions to `COMPLETED`, records verifier ID, and completes active SLA instances.
   - **REWORK_REQUESTED**: Increments `reworkCount`, records supervisor feedback in `WorkCompletionAttempt`, and transitions state to `REWORK_REQUIRED` or back to `IN_PROGRESS`.
3. Every submission and review is immutably appended to `WorkCompletionAttempt` with attempt sequence number, preserving full historical auditability.

## Consequences

- Eliminates unverified closures and provides clear rework audit trails.
- Tracks rework metrics across teams and categories for operational QA.
