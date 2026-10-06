# ADR 060: Operational Teams and Dispatch Mechanisms

## Context

Maintenance staff and field technicians operate within specialized trades (e.g. Electrical, Plumbing, HVAC, Security). Direct individual assignment alone does not support queue-based triage, shift-based assignment, or technician self-claiming.

## Decision

We introduce `HelpdeskTeam` and `HelpdeskTeamMember` models:

1. **Team Queues**: Tickets can be assigned to an operational team without requiring an immediate individual technician assignment.
2. **Technician Self-Claim**: Technicians belonging to a team can claim unassigned tickets from their team queue via `claimTicket()`. Double assignment is guarded by atomic state checks.
3. **Assignment History**: Every reassignment between teams, technicians, or operators creates an immutable `TicketAssignmentHistory` record.

## Consequences

- **Positive**: Supports team dispatch workflows, technician self-service queues, and complete assignment auditing.
- **Negative**: Additional relation tracking for team memberships.
