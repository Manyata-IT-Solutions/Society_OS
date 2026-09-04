# ADR-017: Handling Optional Hierarchy Tiers

## Status

Accepted

## Context

Not all properties have sections (phases/clusters) or vertical towers. For instance, standalone villas belong directly to a community or section without a building/tower enclosure.

## Decision

Allow `sectionId`, `buildingId`, and `floorId` on `Unit` and child entities to be nullable, backed by domain-level parentage validation in `PropertyHierarchyService.validateParentConsistency`.

## Consequences

- **Positive**: Direct modeling of villas, townhouses, and simple standalone buildings.
- **Negative**: Relies on domain layer consistency validation rather than foreign key NOT NULL database constraints.
