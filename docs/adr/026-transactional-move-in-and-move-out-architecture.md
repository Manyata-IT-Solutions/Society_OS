# ADR-026: Transactional Move-In & Move-Out Architecture

## Status

Accepted

## Context

Move-In and Move-Out operations alter multiple domain boundaries simultaneously: residents, households, household members, legal ownerships, rental tenancies, and physical occupancies. Performing these mutations across separate non-atomic endpoints leads to orphaned records and corrupted state.

## Decision

We expose dedicated atomic endpoints (`POST /api/v1/units/:unitId/move-in` and `POST /api/v1/occupancies/:occupancyId/move-out`) that execute within a single PostgreSQL transaction (`prisma.$transaction`). Move-in creates or links residents, household, tenancy/ownership, and occupancy. Move-out terminates occupancy, deactivates household, and ends tenancy while preserving ownership and resident accounts.

## Consequences

- **Positive**: Zero possibility of split-brain or partially completed move-in states.
- **Positive**: Atomic domain events (`unit.move_in_completed.v1`, `unit.move_out_completed.v1`) published reliably.
- **Trade-off**: Requires comprehensive input payloads covering the full move-in composition.
