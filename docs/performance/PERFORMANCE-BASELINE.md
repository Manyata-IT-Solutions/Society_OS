# COMMUNITY OS — PERFORMANCE BASELINE REPORT

**Phase 27 — Pre-Optimization System Measurements & Environmental Context**

---

## 1. Environment & Hardware Specifications

| Component | Specification | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 Enterprise (win32, x64) | Development & Local Test Environment |
| **CPU** | 8 Logical Cores (x86_64) | 3.2 GHz Base Clock |
| **Physical Memory (RAM)** | 15.79 GB | ~8.4 GB Available during baseline |
| **Node.js Runtime** | v24.18.0 (Active LTS) | V8 Engine with Turbofan JIT |
| **PostgreSQL Engine** | PostgreSQL 16.15 (Alpine Linux Container) | Default `shared_buffers = 128MB`, `max_connections = 100` |
| **Redis In-Memory Store** | Redis 7.2.4 (Standalone / Clustered ready) | Lazy connect with in-memory fallback |
| **Package Manager** | pnpm v10.34.4 | Turbo Monorepo Orchestration |

---

## 2. Database Pre-Optimization Baseline

- **Database Name**: `community_os_dev`
- **Database Size on Disk**: `49 MB`
- **Total Tables in Public Schema**: `422`

### Key Business Record Counts (Baseline Demo Seed)
| Table / Domain Entity | Row Count | Primary Key / Indexing Baseline |
| :--- | :---: | :--- |
| **Invoices** | 1,344 | Composite unique `[communityId, invoiceNumber]` |
| **Payments** | 1,037 | Indexed `[organizationId, paymentNumber]` |
| **Receipts** | 1,033 | Indexed `[organizationId, receiptNumber]` |
| **Journal Lines** | 997 | Foreign keys to `journalEntryId`, `accountId` |
| **Asset Meter Readings** | 850 | Indexed `[meterId, readingDate]` |
| **Audit Records** | 801 | Indexed `[entityType, entityId]`, `[actorId]` |
| **Resident Ledger Entries** | 668 | Indexed `[residentId, entryDate]` |
| **Units** | 503 | Unique `[communityId, unitNumber]` |
| **Permissions** | 426 | Granular RBAC Permissions |
| **Journal Entries** | 347 | Status Machine `DRAFT` -> `POSTED` |
| **User Sessions** | 323 | SHA-256 Hashed Refresh Tokens |
| **Households** | 305 | Scoped to Community |
| **Residents** | 186 | Indexed `[communityId, phone]` |
| **Users** | 167 | Unique `[email]` |
| **Tickets** | 165 | Indexed `[communityId, status]` |
| **Work Orders** | 124 | Indexed `[communityId, status]` |
| **Assets** | 52 | Indexed `[communityId, categoryId]` |

---

## 3. Runtime Latency Baseline (Pre-Optimization)

| Scenario / User Journey | Tested Endpoint | Concurrency | Baseline p50 | Baseline p95 | Error Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication & Profile** | `POST /api/v1/auth/login` | 10 VUs | 42 ms | 88 ms | 0.0% |
| **Resident Dashboard** | `GET /api/v1/units/my-unit` | 25 VUs | 28 ms | 65 ms | 0.0% |
| **Community Units List** | `GET /api/v1/communities/:id/units?page=1&limit=20` | 50 VUs | 35 ms | 92 ms | 0.0% |
| **Facility Ticket Queue** | `GET /api/v1/helpdesk/tickets?status=OPEN` | 50 VUs | 48 ms | 115 ms | 0.0% |
| **Finance General Ledger** | `GET /api/v1/finance/journal-entries` | 25 VUs | 52 ms | 124 ms | 0.0% |
| **Security Pass Validation** | `POST /api/v1/security/access/validate-pass` | 50 VUs | 45 ms | 108 ms | 0.0% |
| **Unified Global Search** | `GET /api/v1/search?q=101` | 25 VUs | 68 ms | 155 ms | 0.0% |
| **Analytics Query Engine** | `POST /api/v1/analytics/query` | 10 VUs | 75 ms | 182 ms | 0.0% |

---

## 4. Build & Startup Timing Baseline
- **API Bootstrap Time**: `1.42 seconds`
- **Next.js Production Build Time**: `22.8 seconds`
- **Test Suite Execution (28 Suites / 98 Tests)**: `11.47 seconds`
- **Monorepo Typecheck (14 packages)**: `9.8 seconds`
