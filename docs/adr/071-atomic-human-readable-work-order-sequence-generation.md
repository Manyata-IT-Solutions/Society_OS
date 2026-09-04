# ADR 071: Atomic Human-Readable Work Order Sequence Generation

## Status

Accepted

## Context

Technicians and facility managers need human-readable identifiers like `WO-2026-000042` on printed job sheets, radios, and mobile screens, rather than raw UUIDs. Numbering must be scoped per organization and community, reset annually, and guarantee gap-free atomicity under high concurrent creation.

## Decision

1. Dedicated table `WorkOrderSequence` with composite unique key `[organizationId, communityId, year, prefix]`.
2. Atomic increment query using PostgreSQL `INSERT ... ON CONFLICT DO UPDATE SET current_number = current_number + 1 RETURNING current_number`.
3. Format output as `${prefix}-${year}-${String(currentNumber).padStart(6, '0')}`.

## Consequences

- Guaranteed sequential, readable numbering per community per year without gaps or duplicates.
