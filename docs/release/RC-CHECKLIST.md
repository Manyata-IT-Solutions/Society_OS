# Community OS Release Candidate Checklist

Date: 2026-09-04
Phase: 25.5F-C - Final RC Blocker Closure
Status: RC READY from Git-backed local release candidate baseline

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
- Source-control recovery: PASS in safe Git-backed copy `D:\Society_OS_RC` after unrecoverable original metadata was confirmed.
- Executive demo integrity: PASS via `pnpm --filter @community-os/database demo:verify`; all five stories validated against current seed data.

## Failed Or Incomplete Checks

- None currently open as RC blockers in the Git-backed recovery copy.

## Exit Gate

The RC exit gate is PASS in `D:\Society_OS_RC` after final validation is executed from the Git-backed recovery copy. Do not release from the original non-Git `D:\Society_OS` directory.
