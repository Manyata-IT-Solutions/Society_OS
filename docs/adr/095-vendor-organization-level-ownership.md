# ADR-095: Vendor Organization-Level Ownership

## Status
Accepted

## Context
In residential community operations and facility management, vendors (electrical contractors, DG power specialists, elevator maintenance providers, plumbing suppliers) typically service multiple communities under the same managing organization or developer group.

## Decision
1. Vendors are owned at the `Organization` level (`organizationId`), not duplicated per individual community.
2. Specific community eligibility or restrictions are managed via explicit `VendorCommunityLink` records.
3. Commercial transactions (Purchase Requisitions, Purchase Orders, Goods Receipt Notes) retain their specific `communityId` context while referencing the organization-level vendor.

## Consequences
- **Pros**: Eliminates vendor duplication, unifies vendor master records, and enables organization-wide vendor performance analytics.
- **Cons**: Requires tenant isolation queries to evaluate organization-scoped vendors alongside community-scoped procurement documents.