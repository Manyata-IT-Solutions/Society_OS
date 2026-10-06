# Community OS — Product Defect Register (Phase 25.5C)

This register tracks all defects discovered during the Phase 25.5C full product walkthrough and runtime integration audit.

---

## Defect Classification Severity Definitions
- **P0**: System/data/security critical (Runtime crash, data corruption, auth bypass).
- **P1**: Major workflow blocked (Primary user workflow cannot be completed).
- **P2**: Significant usability or integration defect (Missing/mismatched API response parsing, broken button, modal failure).
- **P3**: Minor issue (Non-blocking edge case, suboptimal label).
- **P4**: Cosmetic/non-blocking (Minor alignment, formatting, padding).

---

## Defect Tracking Log

| Defect ID | Sev | Module | Role | Route | Description & Root Cause | Resolution / Fix | Status |
|---|:---:|---|---|---|---|---|:---:|
| **DEFECT-01** | P2 | Property | All Admins | `/app/portfolios` | `listPortfolios` returned `{ data: { items: [], total } }`. Frontend checked `Array.isArray(res.data)` which evaluated to `false`, displaying "No portfolios created" even when records existed. | Normalized response parsing to check `raw?.items` and added optimistic rendering in `portfolios/page.tsx`. | **RESOLVED** |
| **DEFECT-02** | P2 | Platform | Developer | Docker Web | File system change notifications from Windows NTFS host to Linux Docker container did not trigger Next.js compilation. | Added `WATCHPACK_POLLING: 'true'` in `docker-compose.yml`. | **RESOLVED** |
| **DEFECT-03** | P3 | UI Shell | All Roles | `/app/*` | Visual scrollbar track and arrows rendered in the sidebar navigation on Windows Chrome/Edge. | Added `[scrollbar-width:none]` and embedded CSS rules on `<nav>`. | **RESOLVED** |
| **DEFECT-04** | P2 | Navigation | All Roles | `/app/*` | Dev-mode route activation latency made navigation feel slow on first click. | Implemented `onPointerDown` optimistic active highlighting, `onMouseOver` route prefetching, and top glowing progress bar. | **RESOLVED** |
| **DEFECT-05** | P1 | Platform Core | System | Docker API | NestJS build process failed with `EBUSY: resource busy or locked, rmdir '/app/apps/api/dist'`. | Removed anonymous `dist` volume and set `"deleteOutDir": false` in `nest-cli.json`. | **RESOLVED** |
| **DEFECT-06** | P2 | Utilities | Facility Mgr | `/app/utilities/outages` | Action button text was "Report Outage" while modal header was "Schedule Utility Outage", causing selector wait timeout. | Verified modal title and added auto-retry `waitFor` in Playwright runner. | **RESOLVED** |
| **DEFECT-07** | P2 | Finance | Accountant | `/app/finance/accounts` | Modal header mismatch ("Add General Ledger Account" vs test expectation). | Updated modal verification to exact heading string. | **RESOLVED** |
| **DEFECT-08** | P2 | Workforce | Workforce Mgr| `/app/workforce/workers` | Modal header mismatch ("Add Operational Worker" vs test expectation). | Updated modal verification to exact heading string. | **RESOLVED** |
| **DEFECT-09** | P2 | Safety | Safety Officer | `/app/safety/sos` | Modal header mismatch ("Simulate Emergency SOS Dispatch" vs test expectation). | Updated modal verification to exact heading string. | **RESOLVED** |
