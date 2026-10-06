# Community OS Release Candidate Checklist

Date: 2026-09-03
Phase: 25.5F-B - RC Blocker Resolution
Status: NOT RC READY

## Passed Checks

- Prisma baseline migration created from the current schema.
- Fresh database migration: PASS against isolated `community_os_migration_test`.
- Fresh database seed: PASS against isolated `community_os_migration_test`.
- Existing demo database baseline: PASS using Prisma `migrate resolve --applied`; no destructive DDL was run against existing data.
- Existing database migration rerun: PASS, no pending migrations.
- Schema drift check: PASS, `No difference detected`.
- Dependency audit high/critical gate: PASS, 0 critical and 0 high advisories remain.
- Browser console regression: PASS for login, dashboard, organization/community switching, residents, tickets, work orders, finance, procurement, security, utilities, analytics, and compatibility redirects.
- Redis failure/recovery: PASS in local/test Compose environment. API health, login, authenticated reads, and business table counts survived Redis stop/restart without data repair.
- Route consistency: PASS for `/app/communities`, `/app/facility/preventive`, `/app/budget`, `/app/residents`, and `/app/households` via canonical compatibility redirects.
- Lint: PASS.
- Typecheck: PASS.
- Unit tests: PASS.
- API E2E: PASS after serializing the E2E Jest harness; 28 suites / 439 tests.
- Performance smoke: PASS.
- Admin web production build: PASS.
- Docker build: PASS.
- Docker runtime smoke: PASS for API health, web health, login, admin login, `/app/organizations`, and all five compatibility redirects.

## Failed Or Incomplete Checks

- Git repository validation: FAIL. `D:\Society_OS` is not a Git repository and no recoverable `.git` metadata was found in parent or likely sibling checkout paths.
- Executive demo story walkthrough: FAIL/PARTIAL. The seeded database contains related domain data, but exact story anchors do not fully match the demo script: Unit `A-405` was not found, `ticket_work_order_links` is empty, and the Tower A lift downtime chain was not proven from current data.

## Exit Gate

The RC exit gate remains FAIL until source-control governance is restored and the executive demo stories are either repaired to match seeded data or re-scripted around actual current demo records.
