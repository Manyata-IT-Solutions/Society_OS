# ADR-021: Property Hierarchy Authorization Inheritance

## Status

Accepted

## Context

Permissions must be scoped efficiently down the physical and organizational property hierarchy without demanding duplicate role assignments for every child building, floor, or unit.

## Decision

Inherit permissions downward:
`Platform Role → Organization Scope → Portfolio Scope → Community Scope → Child Property Elements`.
A user possessing `unit.create` on Community `GVT-01` automatically inherits permission to create units in any building or floor under `GVT-01`.

## Consequences

- **Positive**: Simple, predictable role assignments for society administrators and property staff.
- **Negative**: Deep unit-level bespoke permissions require future fine-grained role extensions if needed.
