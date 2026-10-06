# COMMUNITY OS — ENTERPRISE CAPACITY PLANNING

---

## 1. Target Scale Profiles

### Profile A: Standard Community (~600 Units)
- **Scale**: 600 Units, 1,500 Residents, 100 Workers, 5,000 Tickets/yr, 300,000 Gate Events/yr.
- **Recommended Infrastructure**:
  - API: 2 Replicas $	imes$ (1 vCPU, 2 GB RAM)
  - PostgreSQL: 2 vCPU, 4 GB RAM, 50 GB SSD (gp3)
  - Redis: 1 vCPU, 1 GB RAM

### Profile B: Large Community (~10,000 Units)
- **Scale**: 10,000 Units, 25,000 Residents, 1,500 Workers, 100,000 Tickets/yr, 3,000,000 Gate Events/yr.
- **Recommended Infrastructure**:
  - API: 4 Replicas $	imes$ (2 vCPU, 4 GB RAM)
  - PostgreSQL: 4 vCPU, 16 GB RAM, 250 GB SSD (gp3 / io2)
  - Redis: 2 vCPU, 4 GB RAM

### Profile C: Enterprise Portfolio (50,000+ Units across 25 Communities)
- **Scale**: 50,000 Units, 125,000 Residents, 5,000 Workers, 500,000 Invoices/month.
- **Recommended Infrastructure**:
  - API: 8 Replicas $	imes$ (4 vCPU, 8 GB RAM)
  - PostgreSQL: 8 vCPU, 32 GB RAM, 1 TB NVMe SSD + Read Replica
  - Redis: 4 vCPU, 8 GB RAM (Cluster Mode)

---

## 2. 5-Year Storage Growth Forecast

| Storage Domain | 1-Year Forecast | 3-Year Forecast | 5-Year Forecast |
| :--- | :---: | :---: | :---: |
| **PostgreSQL Relational DB** | 12 GB | 45 GB | 95 GB |
| **Object Storage (Documents/Media)** | 50 GB | 200 GB | 550 GB |
| **Audit & Telemetry Logs** | 25 GB | 90 GB | 180 GB |
| **Database Backups (Daily Snapshots)** | 35 GB | 140 GB | 300 GB |
