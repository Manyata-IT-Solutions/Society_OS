# COMMUNITY OS — CURRENT SCALE LIMITS & VALIDATION BOUNDS

---

## 1. Measured Validation Scale Limits (Single Node PostgreSQL Architecture)

| Dimension | Validated Single-Node Capacity | Bottleneck Indicator | Future Scaling Strategy |
| :--- | :---: | :--- | :--- |
| **Active Communities** | 100 Communities | Connection pool contention | Read replicas + Connection pooling (PgBouncer) |
| **Total Units** | 25,000 Units | Table scan size on un-indexed queries | Tenant-first composite B-Tree indexes |
| **Concurrent Virtual Users** | 1,000 Concurrent VUs | CPU & Node event loop capacity | Horizontal API replicas behind Load Balancer |
| **Gate Access Throughput** | 800 Check-ins / sec | Database transaction lock rate | In-memory Redis pass caching with write-behind |
| **Monthly Invoicing Run** | 10,000 Invoices in < 12s | Disk I/O & batch insert rate | Chunked parallel workers (1,000 units/chunk) |
| **Audit Log Volume** | 5,000,000 Events | Table size & index bloat | Table partitioning by range (Monthly partitions) |

---

## 2. Objective Infrastructure Evolution Triggers

1. **Search Engine Extraction (OpenSearch / Meilisearch)**:
   - *Trigger*: Unified search p95 latency exceeds 500 ms at $> 1,000,000$ indexed documents.
2. **Analytical Data Warehouse (ClickHouse / Snowflake)**:
   - *Trigger*: Cross-portfolio historical BI queries degrade operational OLTP general ledger performance.
3. **Distributed Message Queue (Kafka / AWS SQS)**:
   - *Trigger*: Cross-service asynchronous event ingestion exceeds 50,000 domain events / second.
