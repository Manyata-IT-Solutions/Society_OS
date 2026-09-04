# ADR 084: Safe Decommissioning and Replacement Chaining

## Status

Accepted

## Context

Decommissioning a physical asset is a permanent operational event. Retiring an asset while active work orders, preventive plans, or active child subcomponents exist leaves orphaned operations. Furthermore, replacing an asset requires maintaining lineage to the replacement unit.

## Decision

1. **Decommissioning Preconditions**:
   - Checks for open, non-terminal work orders linked to the asset.
   - Validates that active child components are either decommissioned or reassigned.
   - Deactivates or unlinks associated active maintenance plans.
2. **Replacement Lineage**: Supports optional `replacementAssetId` pointing to the successor asset, creating a bidirectional chain of replacement history.
3. **Audit Immutability**: Captures decommissioning timestamp, actor, and detailed engineering rationale.

## Consequences

- Prevents accidental decommissioning of equipment with pending work.
- Full cradle-to-grave traceability across equipment generations.
