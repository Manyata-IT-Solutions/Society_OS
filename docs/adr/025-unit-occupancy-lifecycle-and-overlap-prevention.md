# ADR-025: Unit Occupancy Lifecycle & Overlap Prevention

## Status

Accepted

## Context

A physical unit cannot be actively occupied by multiple disjoint households simultaneously without causing conflict in access control, parking allocations, and billing.

## Decision

We establish `UnitOccupancy` as the single authoritative record of physical presence. Before activating any new occupancy, the system evaluates effective date ranges against existing active/scheduled occupancies:
`(existing.start <= new.end OR new.end IS NULL) AND (existing.end >= new.start OR existing.end IS NULL)`. Overlapping active occupancies are rejected with HTTP 409 Conflict.

## Consequences

- **Positive**: Guarantees mutually exclusive physical residency states.
- **Positive**: Enables scheduled future move-ins without database conflicts.
- **Trade-off**: Requires rigorous date validation on move-in mutations.
