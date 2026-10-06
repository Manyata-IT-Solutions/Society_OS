# ADR 058: SLA Integration and Breach Escalation

## Context

Helpdesk operations require guaranteed response and resolution timeframes based on severity, urgency, and category catalog rules. Without unified SLA tracking, management cannot identify operational bottlenecks or prevent contract breaches.

## Decision

We integrate the Helpdesk module with the Phase 7 SLA Engine:

1. **Category Policy Association**: Each `TicketCategory` declares an optional `defaultSlaPolicyId` pointing to an `SlaPolicyDefinition` (e.g. 4-hour emergency resolution, 48-hour standard resolution).
2. **SLA Clock Lifecycle**:
   - On ticket creation, `SlaService.startSla(...)` initializes an `SlaInstance` with calculated `dueAt` and `warningAt` timestamps factoring in business calendars.
   - On ticket resolution, `SlaService.completeSla(slaInstanceId)` records completion time and marks the SLA satisfied.
   - On ticket hold / pause, SLA clock pausing is supported.
3. **Supervisor SLA Overrides**: Authorized supervisors (`HELPDESK_SLA_OVERRIDE`) can adjust deadlines with recorded justification, emitting audit records.

## Consequences

- **Positive**: Real-time SLA breach warnings, automated status flags, and compliance analytics.
- **Negative**: Requires business calendar evaluation during timestamp calculations.
