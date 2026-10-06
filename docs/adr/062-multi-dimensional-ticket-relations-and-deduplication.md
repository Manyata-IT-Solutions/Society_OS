# ADR 062: Multi-Dimensional Ticket Relations and Deduplication

## Context

Large apartment complexes frequently experience cascading or duplicate issues (e.g. 15 residents in the same building reporting power outage simultaneously, or a pump repair blocking unit plumbing repairs).

## Decision

We introduce a first-class `TicketRelation` graph supporting relation types:

- `PARENT_CHILD`: Master facility work order with sub-tasks.
- `DUPLICATE_OF`: Duplicate reports linked to the primary ticket.
- `BLOCKS` / `BLOCKED_BY`: Operational dependencies.
- `RELATES_TO`: Cross-reference related issues.

## Consequences

- **Positive**: Enables bulk resolution of duplicate incident reports when the master issue is fixed.
- **Negative**: Requires validation against circular dependency graphs.
