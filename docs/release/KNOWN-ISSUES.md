# Community OS Known Issues

Date: 2026-09-04

## RC Blocking

- None currently documented in the Git-backed RC recovery copy `D:\Society_OS_RC`.

## Resolved In Phase 25.5F-B

- Prisma P3005 on existing DB migration was resolved safely with a generated baseline migration and `migrate resolve --applied` after schema drift checks passed.
- Fresh migration from zero now passes on an isolated test database.
- Dependency audit now reports 0 critical and 0 high advisories.
- Browser console regression now has a repeatable Playwright smoke and currently passes.
- Redis failure/recovery was validated in local/test Compose and passed.
- API E2E passed after the E2E harness was serialized: 28 suites / 439 tests.
- Docker build and runtime smoke passed after dependency updates.
- Route 404 mismatch was resolved through compatibility redirects:
  - `/app/communities` redirects to `/app/organizations`.
  - `/app/facility/preventive` redirects to `/app/facility/maintenance-plans`.
  - `/app/budget` redirects to `/app/budgeting`.
  - `/app/residents` redirects to `/app/organizations`.
  - `/app/households` redirects to `/app/organizations`.
- Source-control recovery was completed by creating `D:\Society_OS_RC` after confirming `D:\Society_OS` and parent/sibling paths had no recoverable project Git metadata and the documented GitHub remote was unavailable.
- Executive demo stories are now verified by `pnpm --filter @community-os/database demo:verify` using current seed anchors.

## Non-Blocking Notes

- The original directory `D:\Society_OS` remains non-Git. Release operations should use `D:\Society_OS_RC`.
- `http://localhost:4000/health` returns 404; the working API health route is `http://localhost:4000/api/v1/health`.
- Remaining moderate dependency advisories are documented in `docs/security/DEPENDENCY-SECURITY.md` as non-blocking for this RC based on reachability and dev-only classification.
