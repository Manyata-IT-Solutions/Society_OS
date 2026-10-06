# Backup & Disaster Recovery Strategy

## 1. Overview & Service Level Objectives

Community OS is the system of record for critical property operations, financial ledgers, and resident security data.

### Targets for Production Deployment

- **RPO (Recovery Point Objective)**: `< 5 minutes` (Point-in-Time Recovery via WAL archiving).
- **RTO (Recovery Time Objective)**: `< 30 minutes` for complete cluster recovery.

---

## 2. PostgreSQL Backup Strategy

| Tier               | Mechanism                                                          | Frequency         | Retention | Storage Location                       |
| :----------------- | :----------------------------------------------------------------- | :---------------- | :-------- | :------------------------------------- |
| **Continuous WAL** | Continuous Write-Ahead Log streaming (e.g. pgBackRest / AWS WAL-G) | Continuous        | 30 Days   | Encrypted S3-compatible Object Storage |
| **Full Snapshot**  | `pg_dump` / Physical Volume Snapshot                               | Daily (02:00 UTC) | 90 Days   | Offsite Multi-Region Storage           |
| **Weekly Archive** | GPG-encrypted compressed backup snapshot                           | Weekly            | 1 Year    | Cold / Glacier Storage                 |

---

## 3. Object Storage Backups (Documents, Invoices, Attachments)

- All uploaded assets (invoices, receipts, notices, visitor photo captures) are stored with S3 Versioning enabled.
- Cross-region replication (CRR) ensures resilience against cloud region outages.

---

## 4. Disaster Recovery & Automated Drill Protocol

1. **Automated Restore Verification**:
   - A weekly staging task restores the latest database snapshot to an isolated verification instance and runs a consistency check suite (`SELECT count(*) FROM ...`).
2. **Failover Protocol**:
   - Production PostgreSQL uses primary/standby replication with automatic failover (Patroni or managed AWS RDS Multi-AZ).

---

## 5. Current Phase 0 Status

- **Implemented in Phase 0**:
  - Declarative PostgreSQL schema with migrations.
  - Health check readiness probe monitoring database and Redis liveness.
  - Reproducible Docker Compose infrastructure definitions.
- **Required for Production Deployment**:
  - Cloud provider managed database (AWS RDS / GCP Cloud SQL) with automated automated daily snapshots and continuous WAL archiving.
  - Offsite encrypted object storage replication.
