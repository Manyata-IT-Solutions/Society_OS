# Community OS RC Runbook

Date: 2026-09-04

## Source-Control Location

Use the Git-backed RC recovery copy:

```powershell
Set-Location D:\Society_OS_RC
git status
```

Do not perform release tagging from the original non-Git `D:\Society_OS` directory.

## Start Infrastructure And Runtime

```powershell
docker compose up -d
```

Expected services:

- `community_os_postgres` healthy on host port 5434.
- `community_os_redis` healthy on host port 6379.
- `community_os_api` listening on port 4000.
- `community_os_admin_web` listening on port 3000.

## Health Smoke

```powershell
Invoke-WebRequest http://localhost:4000/api/v1/health -UseBasicParsing
Invoke-WebRequest http://localhost:3000/health -UseBasicParsing
Invoke-WebRequest http://localhost:3000/login -UseBasicParsing
Invoke-WebRequest http://localhost:3000/app/organizations -UseBasicParsing
```

Note: `http://localhost:4000/health` returns 404; the working API health route is under `/api/v1/health`.

## Admin Login Smoke

```powershell
$body = @{ email = 'admin@communityos.io'; password = 'Admin@CommunityOS2026!' } | ConvertTo-Json
Invoke-WebRequest http://localhost:4000/api/v1/auth/login -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

Expected result: HTTP 200 with an access token in `data.tokens.accessToken`.

## Validation Commands

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @community-os/api test:e2e
pnpm demo:seed
pnpm demo:seed
pnpm --filter @community-os/database demo:verify
pnpm --filter @community-os/database db:deploy
pnpm audit --audit-level moderate
pnpm --filter @community-os/admin-web test:browser-console
pnpm build
docker compose build
pnpm --filter @community-os/database perf:reset
pnpm perf:smoke
```

## Known Route Notes

- `/app/communities` redirects to canonical `/app/organizations`.
- `/app/facility/preventive` redirects to canonical `/app/facility/maintenance-plans`.
- `/app/budget` redirects to canonical `/app/budgeting`.
- `/app/residents` redirects to `/app/organizations` as the community selection hub.
- `/app/households` redirects to `/app/organizations` as the community selection hub.

## Database Migration Baseline

The current schema baseline migration is `packages/database/prisma/migrations/20260903154000_baseline_current_schema/migration.sql`.

For an existing non-empty database that already matches the Prisma schema, verify schema drift first and then record the baseline as applied:

```powershell
pnpm --filter @community-os/database exec prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --exit-code
pnpm --filter @community-os/database exec prisma migrate resolve --applied 20260903154000_baseline_current_schema
pnpm --filter @community-os/database db:deploy
```

Do not run `prisma migrate reset` against existing demo or production data to solve P3005.

## Executive Demo Integrity

Run the repeatable verifier after seeding:

```powershell
pnpm --filter @community-os/database demo:verify
```

Expected stories:

- A-301 Water Leak: `TKT-2026-3012` and `WO-2026-3012`.
- Lift Breakdown: `AST-2026-000004`, `WO-DEMO-LIFT-01`, 175 minutes downtime, corrective service record.
- Procurement/AP: `PR-2026-000001`, `RFQ-2026-000001`, `PO-2026-000001`, `GRN-2026-000001`, `APINV-2026-000001`.
- Resident Payment: `INV-2026-000101`, `PAY-2026-000101`, `RCT-2026-000101`.
- Water Quality Incident: `INC-DEMO-WATER-QUALITY-01`.
