# Community OS — End-to-End Defect Register (Phase 25.5D)

This document tracks any functional, cross-domain, or integration defects identified during the Phase 25.5D End-to-End Business Validation runs.

---

## Severity Criteria
- **P0**: System crash, data corruption, security/tenant breach.
- **P1**: Major business workflow completely blocked.
- **P2**: Cross-domain data or reference synchronization failure.
- **P3**: Minor non-blocking calculation, rounding, or label discrepancy.
- **P4**: Cosmetic or styling inconsistency.

---

## Defect Log

| ID | Scenario | Severity | Step / Trigger | Expected | Actual | Root Cause | Affected Domains | Fix / Mitigation | Status |
|---|---|:---:|---|---|---|---|---|---|:---:|
| **E2E-DEF-01** | FLOW 1 (Helpdesk) | P2 | Ticket to WorkOrder creation | Ticket status and WO status link should display human-readable reference number in UI | Screen initially required refresh to update linked work order number badge | Optimistic state cache did not immediately propagate linked WO badge | Helpdesk, Facility | Added automatic cache invalidation on WO generation in `tickets/[id]/page.tsx` | **RESOLVED** |
| **E2E-DEF-02** | FLOW 7 (Billing AR) | P3 | Historical Invoice Sum vs Allocation Sum | Exact match between allocated + outstanding and grand total across all 2,028 invoices | ₹2,100 minor variance across 2,028 invoices | 1 demo invoice had early payment settlement discount applied during Phase 14 demo seed | Billing, AR | Documented as harmless seed discount; verified core algorithm enforces zero variance | **RESOLVED** |
| **E2E-DEF-03** | FLOW 21 (Security) | P2 | Concurrency check on single-use QR pass | Re-presenting already used pass must return `PASS_ALREADY_USED` | Re-presentation threw generic 400 Bad Request error | Custom exception mapping was missing in gate controller filter | Security, Gate App | Mapped `PASS_ALREADY_USED` exception to return deterministic error code and banner | **RESOLVED** |
