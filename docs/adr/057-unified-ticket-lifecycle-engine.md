# ADR 057: Unified Ticket Lifecycle Engine

## Context

Enterprise multi-family residential communities handle numerous service operations: resident complaints, common area facility maintenance, amenity damage reports, security escalations, and vendor work orders. Implementing separate ticketing databases or custom hard-coded state machines for each operational domain leads to inconsistent auditing, duplicate logic, and high maintenance overhead.

## Decision

We model all complaints, work orders, service requests, and maintenance issues under a unified `Ticket` entity backed by the Phase 7 Workflow Engine:

1. **Phase 7 Workflow Instance Delegation**: Every ticket lifecycle is bound to an underlying `WorkflowInstance`. State transitions (e.g. `NEW` → `TRIAGED` → `ASSIGNED` → `IN_PROGRESS` → `ON_HOLD` → `RESOLVED` → `CLOSED`) execute through `WorkflowService.transition({ instanceId, action, actor })`.
2. **Dynamic Allowed Actions**: UI client applications query `WorkflowService.getAllowedActions(instanceId, actor)` to render permissible action buttons based on user roles and workflow definition transition guards.
3. **Optimistic Version Locking**: Ticket records maintain state consistency via transactional transitions and audit log captures.

## Consequences

- **Positive**: Complete reuse of Phase 7 validation, side-effect pipelines, transition logging, and rule-based state guards without duplicating workflow machinery.
- **Negative**: Ticket creation involves starting a workflow instance transactionally.
