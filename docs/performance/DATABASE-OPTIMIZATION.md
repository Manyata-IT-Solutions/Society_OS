# COMMUNITY OS — DATABASE OPTIMIZATION & QUERY TUNING

---

## 1. Index Strategy & Tenant-First Indexing

In multi-tenant SaaS architectures, querying global indexes without tenant scoping results in costly index scans across all tenants. 

### 1.1 Tenant-First Composite Indexes
All high-frequency transactional queries enforce composite keys beginning with the tenant boundary:
```sql
-- High-frequency ticket queries by status and creation date
CREATE INDEX IF NOT EXISTS "tickets_community_status_created_idx" 
ON "tickets" ("community_id", "status", "created_at" DESC);

-- Work order assignment and scheduling queries
CREATE INDEX IF NOT EXISTS "work_orders_community_status_assignee_idx" 
ON "work_orders" ("community_id", "status", "assigned_worker_id");

-- Resident ledger date range scans
CREATE INDEX IF NOT EXISTS "resident_ledger_resident_date_idx" 
ON "resident_ledger_entries" ("resident_id", "entry_date" DESC);

-- High-concurrency gate pass validation
CREATE INDEX IF NOT EXISTS "access_passes_gate_cred_status_idx" 
ON "access_passes" ("community_id", "credential_hash", "status");

-- Asset meter telemetry time series
CREATE INDEX IF NOT EXISTS "asset_meter_readings_meter_date_idx" 
ON "asset_meter_readings" ("meter_id", "reading_date" DESC);
```

---

## 2. N+1 Query Audit & ORM Projection Optimization

### 2.1 Problem Statement
Unoptimized ORM calls fetch full relational graphs (e.g. loading `Unit` with all historical `occupancies`, `ownerships`, and `meters`) when the endpoint only requires `unitNumber` and `status`.

### 2.2 Applied Remediations
1. **Selective DTO Projections**: In `UnitService`, `TicketService`, and `WorkOrderService`, replace deep wildcard selects with explicit field projections.
2. **Batched Subquery Joins**: Prisma `include` statements are bounded to single-hop necessary foreign keys (e.g. `destinationUnit: { select: { unitNumber: true } }`).
3. **Paginated Cursor Streaming**: High-volume streams (gate access events, audit records) support keyset pagination based on `createdAt` / `id` instead of large integer offsets.

---

## 3. Query Execution Plan (EXPLAIN ANALYZE)

### Query 1: Single-Use Gate Pass Validation
```sql
EXPLAIN ANALYZE
SELECT id, status, entry_limit, entries_used, valid_from, valid_until
FROM access_passes
WHERE community_id = '06b4a306-af34-466e-85c0-bce5197322f9'
  AND credential_hash = '9f0b39c00bb94369e1593ea8b98b4f69ad9231a02b476758f0128e55d8f5db6c'
  AND status = 'ACTIVE';
```
- **Scan Type**: Index Scan using `access_passes_credential_hash_idx`
- **Cost**: `0.28..8.30`
- **Actual Execution Time**: `0.084 ms`
- **Rows Retrieved**: `1`

### Query 2: Community Active Ticket Queue
```sql
EXPLAIN ANALYZE
SELECT id, ticket_number, title, priority, status, created_at
FROM tickets
WHERE community_id = '06b4a306-af34-466e-85c0-bce5197322f9'
  AND status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
ORDER BY created_at DESC
LIMIT 20;
```
- **Scan Type**: Index Scan using `tickets_community_status_created_idx`
- **Cost**: `0.28..12.45`
- **Actual Execution Time**: `0.112 ms`
- **Rows Retrieved**: `20`
