# ADR 082: Preventive Maintenance and Work Order Asset Integration

## Status

Accepted

## Context

Physical assets require seamless integration with Phase 9 Work Orders and Maintenance Plans. A Work Order may target a specific asset, and completing a work order must update the asset's service history without creating tight coupling between domain tables.

## Decision

1. **Explicit Association**: `WorkOrderAssetLink` connects work orders to assets with explicit relationship types (`PRIMARY_ASSET`, `RELATED_ASSET`, `COMPONENT`).
2. **Maintenance Plan Target**: `MaintenancePlan` stores `targetAssetId`, automatically creating the asset linkage upon occurrence generation.
3. **Automated Service Records**: Completing a work order linked to an asset creates an immutable `AssetServiceRecord` capturing the work type, resolution summary, and labor duration.

## Consequences

- Unified 360-degree timeline of all corrective repairs and preventive services on the asset detail page.
- Clean architectural decoupling between facility scheduling and asset registry tables.
