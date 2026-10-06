# ADR 079: Asset Hierarchy and Subcomponent Parentage

## Status

Accepted

## Context

Complex industrial systems (such as a 500kVA DG set) contain major maintainable sub-components (such as the Turbocharger, Alternator, and Electronic Control Module) that have independent warranties, serial numbers, and service histories.
Modeling these subcomponents requires a parent-child relationship while preventing cyclic graphs and orphaned dependencies.

## Decision

1. **Self-Referencing Hierarchy**: `Asset` contains an optional `parentAssetId` referencing another asset within the same organization and community.
2. **Acyclic Invariant**: Moving or assigning parentage validates that an asset cannot be its own ancestor (cycle detection).
3. **Decommissioning Safeguard**: Decommissioning a parent asset evaluates all active child components, requiring explicit child reassignment or bulk retirement.

## Consequences

- Supports complex multi-tier equipment trees (Chiller Plant -> Chiller Unit 1 -> Compressor A).
- Enables rolling up service costs and downtime metrics from child components to the parent system.
