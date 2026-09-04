# ADR 048: Immutable Definition Versioning and Runtime Instance Isolation

## Context

Modifying an active workflow or approval definition in place can corrupt running instances, creating race conditions, orphaned states, and invalid decision quorums.

## Decision

All automation definitions (Workflows, Rule Definitions, Approval Policies, and SLA Policies) adhere to a strict 3-state lifecycle: `DRAFT`, `PUBLISHED`, and `RETIRED`.

1. **Frozen Upon Publication**: Once published, definitions are strictly immutable. Any modification requires cloning into a new integer version (e.g. v1 $\to$ v2).
2. **Runtime Instance Isolation**: When a workflow instance starts, it binds to a specific immutable `(key, version)`. Ongoing instances continue executing against their initial version definition until completion, immune to subsequent definition version updates.

## Consequences

- **Positive**: Zero risk of in-flight instance corruption; complete backward compatibility and historical reproducibility for audit trails.
- **Negative**: Requires version branching UX for administrative edits.
