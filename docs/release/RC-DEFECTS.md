# Community OS RC Defects

Date: 2026-09-04

## Fixed In Phase 25.5F-B

- Prisma migration history was missing. Created baseline migration `20260903154000_baseline_current_schema`.
- Existing non-empty database migration failed with Prisma P3005. Resolved by verifying schema drift first, then marking the baseline migration applied with Prisma's supported migration-resolution mechanism.
- Dependency audit reported high advisories. Compatible upgrades and pnpm overrides reduced audit output to 0 critical and 0 high advisories.
- Browser console regression was not executable. Added a repeatable Playwright-based browser console smoke runner and fixed hydration/runtime issues it exposed.
- Redis failure recovery was not executed. Completed local/test Redis stop/restart validation.
- Expected/documented routes returned unexplained 404. Added compatibility redirects and corrected sidebar links for `/app/communities`, `/app/facility/preventive`, `/app/budget`, `/app/residents`, and `/app/households`.
- E2E harness had unstable parallel startup behavior for large Nest/Prisma suites. Serialized the API E2E Jest config and raised the E2E timeout without skipping assertions.
- AP E2E vendor ledger assertion selected a pre-existing seeded supplier-invoice ledger entry for the vendor instead of the just-posted test invoice. The assertion now filters by the posted invoice's internal invoice number.
- Final API E2E rerun passed: 28 suites / 439 tests.
- Docker build and runtime smoke passed after dependency updates.

## Remaining RC Defects

- None currently documented as RC-blocking after Phase 25.5F-C validation.

## Fixed In Phase 25.5F-C

- Source-control governance restored in the safe Git-backed recovery copy `D:\Society_OS_RC` after confirming no recoverable `.git` metadata existed in `D:\Society_OS`, parent `D:\`, or related sibling paths and the documented remote was unavailable.
- Executive demo story validation reconciled with actual seeded data. The walkthrough now uses current anchors: A-301 Water Leak (`TKT-2026-3012`, `WO-2026-3012`), Lift Breakdown (`AST-2026-000004`, `WO-DEMO-LIFT-01`, 175 minutes downtime), Procurement/AP (`PR-2026-000001`, `RFQ-2026-000001`, `PO-2026-000001`, `GRN-2026-000001`, `APINV-2026-000001`), Resident Payment (`INV-2026-000101`, `PAY-2026-000101`, `RCT-2026-000101`), and Water Quality Incident (`INC-DEMO-WATER-QUALITY-01`).
- Added repeatable executive demo integrity verification via `pnpm --filter @community-os/database demo:verify`.
