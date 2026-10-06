# Community OS RC Defects

Date: 2026-09-03

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

- The workspace lacks Git metadata. Branch, diff, log, release tagging, and uncommitted-change accounting are unavailable until source-control history is recovered or a safe repository migration is approved.
- Executive demo story validation is incomplete against the current seeded data. The scripted A-405 Water Leak, ticket-to-work-order linkage, and Tower A lift downtime chain do not fully exist as documented.
