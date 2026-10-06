# ADR 047: Declarative Workflow Engine Architecture

## Context

Community OS requires complex business process automation across different operational domains (maintenance requests, architectural changes, expense approvals, resident move-ins). Embedding custom hard-coded state transitions or procedural code inside domain modules creates maintenance friction and violates the "Configure, Do Not Customize" architecture principle. Conversely, adopting heavy enterprise BPM monsters (e.g. Camunda, Temporal) introduces excessive operational complexity and encourages arbitrary script execution (`eval()`, dynamic SQL), compromising multi-tenant security and determinism.

## Decision

We implement a lightweight, bounded, and purely declarative workflow state machine platform:

1. **Declarative State Machines**: Workflows are configured via declarative graph descriptors containing unique state keys (`type: START | ACTIVE | APPROVAL | COMPLETED | CANCELLED | FAILED`), explicit transitions, allowed actions, reason requirements, and guard rule references.
2. **Domain-Neutral Resource Model**: Workflows bind to generic target entities using neutral identifiers (`resourceType`, `resourceId`) rather than hard-coded domain foreign keys.
3. **No Arbitrary Code Execution**: State evaluation and transitions are completely deterministic with zero arbitrary JavaScript `eval()` or dynamic SQL execution.

## Consequences

- **Positive**: Complete domain neutrality, high security, predictable deterministic executions, full auditability.
- **Negative**: Dynamic loops or non-deterministic algorithmic transitions must be structured as multi-step workflow graphs rather than arbitrary procedural scripts.
