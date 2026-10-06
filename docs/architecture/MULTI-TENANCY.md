# Multi-Tenancy Architecture: Community OS

## 1. Enterprise Structural Hierarchy

Community OS is designed around an enterprise multi-tier hierarchy:

```
Platform (Global Operator / SaaS Infrastructure Control Plane)
  └── Organization (Enterprise Customer / Property Management Co. / Housing Group)
        └── [Future Phase: Portfolio] (Regional / Asset Groupings)
              └── Community (Individual Society / Township / Complex)
                    └── [Future Phase: Phase / Cluster] (Sub-developments)
                          └── [Future Phase: Tower / Block] (Vertical units)
                                └── [Future Phase: Floor]
                                      └── [Future Phase: Unit] (Apartment / Villa)
                                            └── [Future Phase: Household]
                                                  └── [Future Phase: Resident]
```

### Phase 1 Implemented Scope

- **`Organization`**: The root enterprise customer account (e.g. "Prestige Management Corp", "Demo Community Corp").
- **`Community`**: An individual property / residential society (e.g. "Green Valley Township", "Palm Meadows Heights"). Every Community belongs to exactly one Organization.

---

## 2. Tenancy Strategy & Data Isolation

### Shared Database with Logical Tenant Boundaries

- All multi-tenant records reside in a shared PostgreSQL database.
- Every tenant-owned table contains mandatory foreign keys: `organization_id` and (where applicable) `community_id`.
- Foreign keys are enforced with database-level `ON DELETE CASCADE` or `ON DELETE RESTRICT` constraints.
- Compound unique constraints ensure scoped uniqueness (e.g., community code or slug is unique within its parent organization).

### Multi-Tenancy Isolation Guarantees

| Isolation Dimension     | Enforcement Mechanism                                                                                                 |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Routing / Ingress**   | Tenant headers (`x-organization-id`, `x-community-id`) and URI path parameters resolved by `TenantContextMiddleware`. |
| **Application Context** | Asynchronous context propagation using Node.js `AsyncLocalStorage` via `RequestContext`.                              |
| **Repository Layer**    | `TenantScopedRepository` base class mandating `TenantContext` parameter for all queries.                              |
| **Database Layer**      | Compound unique constraints (`organization_id, code`) and foreign keys.                                               |
| **Security Tests**      | Automated CI suite asserting cross-tenant access attempts return `404 Not Found` or `403 Forbidden`.                  |

---

## 3. Defense in Depth: Application Filtering vs PostgreSQL RLS

Community OS employs **Application-Level Context Scoping with Repository Guardrails** as the primary isolation mechanism in Phase 1, with a clean architectural path toward PostgreSQL Row-Level Security (RLS) as evaluated in **[ADR-007](file:///d:/Society_OS/docs/adr/ADR-007-tenant-isolation-rls-evaluation.md)**.

### Isolation Rules

1. **Never Trust Client Tenant Headers Alone**:
   - Tenant headers (`x-organization-id`) are verified against authenticated user memberships or route parameters.
2. **No Unscoped Repositories in Tenant Code**:
   - `CommunityRepository` only accepts scoped queries. Developers cannot accidentally call `findAll()` across all tenants.
3. **Optimistic Concurrency Control**:
   - Version counters prevent race conditions during concurrent administrative mutations across multi-user environments.
