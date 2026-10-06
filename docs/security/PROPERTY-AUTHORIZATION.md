# Property Authorization & Cross-Tenant Defense

## 1. Multi-Tenant Scoping Rules

1. **Explicit Community Scoping**: Every API request mutating or reading property hierarchy components (`sections`, `buildings`, `floors`, `units`) evaluates the active actor's scoped permissions against the target `communityId` and `organizationId`.
2. **Denormalized Database Foreign Keys**: Child records explicitly store `organizationId` and `communityId`, allowing database-level enforcement of tenant queries without relying on nested joins.
3. **Optimistic Concurrency Protection**: Every property entity maintains an integer `version` field. Concurrent modification attempts with stale version tags are rejected with `409 CONFLICT` (`ConcurrencyConflictException`).

---

## 2. Threat Mitigation Matrix

| Attack Vector             | Vulnerability Type                | Community OS Mitigation                                                                                                   |
| :------------------------ | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| Cross-Community IDOR      | Unauthorized Data Modification    | `PermissionGuard` checks `communityId` parameter against caller's active memberships and role assignments.                |
| Malicious CSV Export      | Formula Injection (CSV Injection) | Export generator prepends single quotes (`'`) to values starting with `=`, `+`, `-`, or `@`.                              |
| Concurrent Bulk Overwrite | Race Conditions in Unit Creation  | Batch inserts run in atomic transactions with strict unique constraints on `(community_id, building_id, unit_number)`.    |
| Orphaned Child Entities   | Broken Relational Graph           | `PropertyHierarchyService.validateParentConsistency` verifies building, section, and floor parentage at the domain layer. |
