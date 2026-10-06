# ADR 078: Location Hierarchy and Movement History

## Status

Accepted

## Context

Physical assets move over time (e.g., a portable submersible pump moved from Tower A Basement to Tower B STP, or an elevator drive motor sent to a workshop for rewinding).
Updating an asset's location in place without maintaining historical records makes audit trails impossible and invalidates previous work order context.

## Decision

1. **Polymorphic Property Hierarchy**: An asset's current location links to the Phase 3 Property Master via `locationType` (`COMMUNITY`, `BUILDING`, `FLOOR`, `UNIT`, `OTHER`) with foreign keys to `buildingId`, `floorId`, `unitId`, etc.
2. **Append-Only Movement Log**: Every location change is recorded in `AssetLocationHistory` with `from*` and `to*` coordinates, actor attribution, timestamp, and transfer reason.
3. **Decoupled Work Order Preservation**: Historical work orders retain their original location snapshot and are never retroactively modified when an asset moves.

## Consequences

- Full accountability for physical asset movements and custodial handovers.
- Seamless spatial querying across communities, buildings, and rooms.
