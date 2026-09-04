# Database Guidelines & Best Practices

## 1. System of Record Principles

PostgreSQL 16 is the authoritative system of record for Community OS.

---

## 2. Identifier Strategy: UUIDs & UUIDv7

- All primary keys use `UUID` data types.
- Random UUIDs (`gen_random_uuid()` / `uuid_generate_v4()`) or time-sortable UUIDv7 formats ensure:
  1. No enumerable sequence ID exposure in API URLs.
  2. Safe client-side / offline ID generation for mobile sync.
  3. High-throughput distributed ingestion without sequence contention.

---

## 3. Monetary Values & Financial Integrity

**CRITICAL RULE: Never use floating-point types (`float`, `real`, `double precision`) for monetary values.**

1. Monetary values are stored as:
   - **Integer in Minor Currency Units** (e.g. `amount_in_cents` / `amount_in_paise`: `10050` = `₹100.50` or `$100.50`), OR
   - **`numeric(15, 2)` / `decimal(15, 4)`** for multi-rate tax calculations.
2. Currency codes must strictly adhere to **ISO 4217** (e.g. `'INR'`, `'USD'`, `'AED'`).

---

## 4. Timestamps & Timezones

1. All database timestamp columns must use `timestamptz` (Timestamp with Time Zone).
2. The database server and container default timezone is strictly `UTC`.
3. Client-facing formatting is handled at the presentation boundary using the Community's configured timezone (e.g. `Asia/Kolkata`).

---

## 5. Foreign Keys, Indexes & Constraints

1. **Foreign Key Indexes**:
   - PostgreSQL does _not_ automatically index foreign key columns. Every foreign key (`organization_id`, `community_id`, `user_id`, etc.) must have an explicit `@@index`.
2. **Compound Unique Constraints**:
   - Multi-tenant unique constraints must include the tenant discriminator:
     ```prisma
     @@unique([organizationId, code])
     ```
3. **Database Constraints over Application Logic**:
   - Always enforce critical invariants at the database schema level (`NOT NULL`, `CHECK`, `FOREIGN KEY`, `UNIQUE`). Never assume application validation alone is sufficient.

---

## 6. Migration Governance

1. Never manually edit previously applied migration SQL files.
2. Every migration must be tested against a rollback plan.
3. In production, migrations run via `prisma migrate deploy` in a pre-deployment pipeline before new application containers boot.
