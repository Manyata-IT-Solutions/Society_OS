# ADR 056: Side-Effect Pipeline and Decoupled Subsystem Orchestration

## Context

A state transition in a workflow frequently triggers ancillary platform operations: opening an approval process, starting or pausing an SLA timer, sending notifications, or updating audit logs. Tightly coupling these subsystem calls directly inside state machine transitions leads to spaghetti dependencies and fragile transactions.

## Decision

We orchestrate subsystem integrations through a structured declarative Side-Effect Pipeline and asynchronous Domain Events:

1. **Declarative Transition Side Effects**: Workflow transitions declare structured side-effect descriptors:
   - `START_APPROVAL`: Invokes `ApprovalService.startApproval({ policyKey })`.
   - `START_SLA`: Invokes `SlaService.startSla({ policyKey })`.
   - `PAUSE_SLA`: Pauses active SLA instances.
   - `RESUME_SLA`: Resumes paused SLA instances, calculating elapsed pause duration.
   - `COMPLETE_SLA`: Completes active SLA instances upon reaching terminal/satisfaction states.
2. **Domain Event Broadcasting**: Every transition, approval decision, and SLA milestone publishes standard domain events (`workflow.transitioned.v1`, `approval.approved.v1`, `sla.warning.v1`) to the transactional event bus, enabling decoupled subscribers (audit projections, notifications) to react asynchronously.

## Consequences

- **Positive**: Clean separation of concerns between state transitions, approval quorums, SLA clocks, and notification subscribers.
- **Negative**: Subsystem side-effects that execute synchronously must be kept lightweight to maintain swift HTTP transition response times.
