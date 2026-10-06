# ADR 054: Optimistic Concurrency Locking in Workflow Transitions

## Context

In multi-user enterprise operations, two operators or automated agents may simultaneously attempt to transition the same workflow instance (e.g. Operator A rejects while Operator B approves). Without concurrency control, lost updates or invalid double transitions can occur.

## Decision

We implement optimistic concurrency locking via an integer `version` field:

1. **Version Checking**: Clients supply `expectedVersion` when submitting transition requests (`POST /workflows/instances/:id/transition { "action": "approve", "expectedVersion": 2 }`).
2. **Transactional Compare-and-Increment**: The transition executes inside a database transaction that verifies `current.version === expectedVersion`.
3. **Conflict Rejection**: If the versions do not match, the request immediately fails with `409 Conflict (WORKFLOW_CONCURRENCY_CONFLICT)`.
4. **Append-Only History**: Every successful transition atomically increments `version` and appends an immutable record to `workflow_transition_history`.

## Consequences

- **Positive**: Strict prevention of race conditions, lost updates, or split-brain transitions.
- **Negative**: Clients experiencing a race conflict must refresh instance state and present updated allowed actions to the user.
