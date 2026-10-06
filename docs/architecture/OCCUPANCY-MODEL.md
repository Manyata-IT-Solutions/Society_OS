# Unit Occupancy Lifecycle Model

## 1. Overview

`UnitOccupancy` tracks real-time physical residency within a Unit. It is strictly separated from legal property ownership and lease tenancy records.

---

## 2. Occupancy Types & States

### Occupancy Types:

- `OWNER_OCCUPIED`: The legal owner(s) reside in the unit.
- `TENANT_OCCUPIED`: A rental tenant household occupies the unit under a lease agreement.
- `FAMILY_OCCUPIED`: Non-owner family members reside without a formal commercial lease.
- `OTHER`: Guest, caretaker, or special occupancy.

### Occupancy Statuses:

- `SCHEDULED`: Move-in confirmed for a future effective date.
- `ACTIVE`: Currently occupying the unit.
- `ENDED`: Move-out completed; historical record preserved.
- `CANCELLED`: Scheduled move-in aborted before taking effect.

---

## 3. Effective-Date Overlap Prevention

To prevent split-brain occupancy states, Community OS enforces strict date range disjointness across active and scheduled occupancies on the same physical unit:

```sql
WHERE unit_id = :unitId
  AND status IN ('ACTIVE', 'SCHEDULED')
  AND (end_date IS NULL OR end_date >= :newStartDate)
  AND (start_date <= :newEndDate OR :newEndDate IS NULL)
```
