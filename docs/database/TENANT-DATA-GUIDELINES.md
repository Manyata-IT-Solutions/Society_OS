# Tenant Data Guidelines & Constraints

## 1. Database Schema Standards

All multi-tenant tables in PostgreSQL must adhere to these standards:

1. **Foreign Keys**:
   - `organization_id UUID NOT NULL` on all top-level tenant entities.
   - `community_id UUID` on community-scoped entities.
   - Explicit `ON DELETE CASCADE` or `ON DELETE RESTRICT` foreign key actions.
2. **Compound Unique Constraints**:
   - Unique constraints must include the tenant discriminator:
     ```prisma
     @@unique([organizationId, code])
     @@unique([organizationId, slug])
     ```
3. **Optimistic Locking**:
   - `version Int @default(1)` must be present on mutable aggregates.
4. **Timezone & Timestamps**:
   - `created_at DateTime @default(now()) @db.Timestamptz(6)`
   - `updated_at DateTime @updatedAt @db.Timestamptz(6)`

---

## 2. Indexing Strategy

To guarantee query performance under 1,000+ organizations and 10,000+ units:

- Index on `[organization_id]` (PostgreSQL does not auto-index foreign keys).
- Index on `[organization_id, status]` for common filtered listing queries.
- Index on `[slug]` and `[code]` for rapid lookups.
- Index on `[created_at]` for chronological audit logs and pagination.

---

## 3. Migration Safety Protocol

1. **Additive Forward Migrations**:
   - Always add new columns as nullable or with a default value.
2. **No Breaking Drops**:
   - Deprecated columns must be phased out in multi-step releases:
     1. Stop writing in code.
     2. Stop reading in code.
     3. Drop column in a subsequent migration.
