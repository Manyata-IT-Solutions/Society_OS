# COMMUNITY OS — SYSTEM RELIABILITY & FAILURE RECOVERY MATRIX

---

| Subsystem / Dependency | Failure Scenario | System Behavior & Mitigation | Recovery Action |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Database restart or transient network blip. | API rejects requests with controlled 503; connection pool automatically reconnects on recovery. | Zero manual restart required; Prisma pool re-establishes connections in < 2s. |
| **Redis Cache / Store** | Redis node offline or restart. | Cache calls bypass smoothly to PostgreSQL source of truth; rate limits fail closed safely. | Redis service resumes; cache refills on demand without data loss. |
| **BullMQ Background Worker** | Worker process killed mid-job. | Incomplete job visibility lock expires; job is picked up by survivor worker with idempotent key. | Automatic retry with backoff; zero duplicate financial or billing records. |
| **Object Storage** | MinIO / S3 storage unavailable. | Document upload returns clean 503; operational ERP actions without attachments proceed normally. | Signed URL retries after storage recovery. |
| **AI Provider** | Mock/External AI service timeout or error. | Natural-language query returns graceful fallback notification; core accounting/ticketing unaffected. | Circuit breaker cooldown prevents cascading timeouts. |
