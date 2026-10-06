# ADR-018: Unit Uniqueness & Denormalized Tenant Keys

## Status

Accepted

## Context

In residential communities, duplicate unit numbers (such as Unit 101 in Tower A and Unit 101 in Tower B) are common. However, duplicate unit numbers within the same building (or within the community for standalone units) are invalid. Furthermore, tenant queries must execute with extreme performance without deep recursive JOINs.

## Decision

1. Apply composite uniqueness constraint: `@@unique([communityId, buildingId, unitNumber])`.
2. Denormalize `organizationId` and `communityId` on `Building`, `Floor`, and `Unit` models.

## Consequences

- **Positive**: Prevents duplicate unit addressing in towers, allows identical unit numbers across different towers, and ensures $O(1)$ indexed tenant-isolated queries.
- **Negative**: Redundant storage of `organizationId` and `communityId` foreign keys across child records.
