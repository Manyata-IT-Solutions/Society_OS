# COMMUNITY OS — QUEUE RELIABILITY & EVENT BUS ARCHITECTURE

---

## 1. Domain Event Bus & Background Worker Topology

| Queue / Channel | Worker Class | Concurrency | Retry Policy | Backoff Strategy | Dead-Letter Handling |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **audit.events** | `AuditWorker` | 10 | 3 Retries | Exponential (`1s, 5s, 15s`) | Dead-Letter Log Record |
| **notifications** | `NotificationWorker` | 20 | 5 Retries | Exponential (`2s, 10s, 30s`) | Notification Failed State |
| **billing.runs** | `BillingRunWorker` | 2 | 2 Retries | Linear (`10s`) | Transaction Abort & Alert |
| **pm.generation** | `MaintenanceWorker` | 4 | 3 Retries | Exponential (`5s, 20s`) | Task Error Log |
| **search.projection** | `SearchIndexWorker` | 8 | 3 Retries | Exponential (`1s, 5s`) | Outbox Reconciliation |

---

## 2. Fault Tolerance & Poison Job Defense
- **Poison Job Neutralization**: Jobs failing all retry attempts transition cleanly to `FAILED` status with error stack traces preserved, preventing queue head-of-line blocking.
- **Worker Crash Resiliency**: BullMQ locks and visibility timeouts ensure in-flight jobs from crashed worker nodes are automatically re-assigned to healthy workers.
- **Idempotent Job Consumers**: Every background job includes a unique execution key or status transition check preventing duplicate financial postings or duplicate notifications.
