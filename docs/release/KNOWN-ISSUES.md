# Community OS Known Issues

Date: 2026-09-03

## RC Blocking

- The workspace at `D:\Society_OS` is not a Git repository. No `.git` directory or worktree reference was found in the project or parent path, and sibling `.git` directories discovered under `D:\` belong to unrelated projects. The README documents `https://github.com/community-os/community-os`, but the current directory must not be overwritten by a clone.
- Executive demo stories are not yet fully validated against current seeded data. Evidence found related domain records, but exact scripted anchors are incomplete: Unit `A-405` was not found, `ticket_work_order_links` is empty, and the Tower A lift downtime chain was not proven.

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

## Non-Blocking Notes

- `http://localhost:4000/health` returns 404; the working API health route is `http://localhost:4000/api/v1/health`.
- Remaining moderate dependency advisories are documented in `docs/security/DEPENDENCY-SECURITY.md` as non-blocking for this RC based on reachability and dev-only classification.
