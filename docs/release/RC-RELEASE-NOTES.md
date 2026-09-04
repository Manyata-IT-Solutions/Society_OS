# Community OS RC Release Notes

Date: 2026-09-04
Candidate: v1.0.0-rc.1 concept only
Status: RC READY from Git-backed local release candidate baseline

## Stabilization Summary

Phase 25.5F continuation focused on regression cleanup and release validation. The session fixed failing E2E suites in budgeting, resident billing/AR, procurement, analytics/AI, amenities, and performance smoke. It also resolved lint failures and added safer validation around resident account creation.

Phase 25.5F-B focused only on the remaining RC blockers. It added a safe Prisma baseline migration, resolved Prisma P3005 for the existing demo database without destructive DDL, eliminated high/critical dependency advisories, added a repeatable browser console smoke, validated Redis outage/recovery behavior, and corrected documented route 404s with compatibility redirects.

Phase 25.5F-C closed the final RC blockers by recovering source-control governance into the safe Git-backed copy `D:\Society_OS_RC` and reconciling the executive demo walkthrough with current idempotent seed data. It also added a repeatable executive demo integrity verifier.

## Validation Summary

- Full API E2E now passes: 28 suites, 439 tests.
- Unit tests pass for API and admin web.
- Lint passes with warnings only.
- Typecheck passes across the workspace.
- Demo seed and demo seed idempotency pass.
- Performance smoke passes.
- Production build passes.
- Docker build passes.
- Docker runtime smoke passes for canonical health, login, and organization pages.
- Fresh database migration and fresh seed pass from the new migration history.
- Existing database baseline, migration deploy, and migration rerun pass.
- Dependency audit reports 0 critical and 0 high advisories.
- Browser console smoke passes for 15 representative routes.
- Redis failure/recovery passes in local/test Compose.
- Final API E2E passes after E2E harness serialization: 28 suites / 439 tests.
- Docker build and runtime smoke pass after dependency updates.
- Source-control validation passes from `D:\Society_OS_RC`.
- Executive demo validation passes for all five stories via `pnpm --filter @community-os/database demo:verify`.

## Release Limitations

Release operations should be performed only from the Git-backed recovery copy `D:\Society_OS_RC`. The original `D:\Society_OS` directory remains non-Git and should not be used for release tagging.
