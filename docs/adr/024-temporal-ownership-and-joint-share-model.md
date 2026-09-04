# ADR-024: Temporal Ownership & Joint Share Model

## Status

Accepted

## Context

Simple property systems store an `ownerId` directly on the `Unit` table. This fails in enterprise settings where properties have joint owners with percentage shares, corporate titles, and historical title transfers.

## Decision

We model property ownership via `UnitOwnership`, storing `residentId`, `unitId`, `ownershipType` (`SOLE`, `JOINT`, `CORPORATE`, `DEVELOPER`, `TRUST`, `OTHER`), `ownershipShare` (`Decimal(5, 2)`), `startDate`, `endDate`, and `status`. Total active shares on a unit cannot exceed 100.00%.

## Consequences

- **Positive**: Supports joint family ownership, corporate titles, and percentage equity splits.
- **Positive**: Complete immutable title history across property sales and transfers.
- **Trade-off**: Requires transactional share sum validation upon creation and transfer.
