# COMMUNITY OS - DEPENDENCY SECURITY AUDIT

Date: 2026-09-03
Scope: Phase 25.5F-B RC blocker resolution
Command: `pnpm audit --audit-level moderate --json`

## Summary

| State | Critical | High | Moderate | Low |
| :--- | ---: | ---: | ---: | ---: |
| Before Phase 25.5F-B fixes | 0 | 22 | 26 | 6 |
| After Phase 25.5F-B fixes | 0 | 0 | 2 | 3 |

No critical or high advisories remain after compatible dependency updates and pnpm overrides.

## Fixed High-Advisory Surface

| Package | Resolution |
| :--- | :--- |
| `next` | Upgraded admin web from Next 14 to Next 15.5.x. |
| `eslint-config-next` | Upgraded to match the Next 15 line. |
| `multer` | Resolved to patched 2.2.x through pnpm override. |
| `glob` | Resolved to patched 10.5.x through pnpm override. |
| `js-yaml` | Resolved to patched 4.3.x through pnpm override. |
| `lodash` | Resolved to patched 4.18.x through pnpm override. |
| `picomatch` | Resolved to patched 4.0.x through pnpm override. |
| `postcss` | Resolved to patched 8.5.x through pnpm override. |
| `tmp` | Resolved to patched 0.2.x through pnpm override. |
| `deepmerge-ts` | Resolved to patched 8.0.x through pnpm override. |
| `file-type` | Resolved to patched 21.3.x through pnpm override. |
| `qs` | Resolved to patched 6.16.x through pnpm override. |

## Remaining Moderate Advisories

| Package | Installed | Advisory | Path | Runtime / Dev | Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `@nestjs/core` | 10.4.22 | CVE-2026-35515 / GHSA-36xv-jgw5-4q75, SSE event field injection | `apps__api>@nestjs/core` | Runtime framework | NOT REACHABLE for current RC. Source search found no `@Sse(`, `EventSource`, `text/event-stream`, or Server-Sent Events implementation in non-dist app/package code. Major Nest 11 upgrade is deferred to a planned framework upgrade, not forced into RC freeze. |
| `ajv` | 8.12.0 | CVE-2025-69873 / GHSA-2g4f-4pwh-qvx6, ReDoS with `$data: true` | `apps__api>@nestjs/cli>@angular-devkit/core>ajv` | Dev-only CLI path | DEV ONLY / NON-BLOCKING. A direct override to `ajv@8.18.0` was tested and rejected because it broke ESLint tooling compatibility. No runtime application path uses this package. |

## Validation After Dependency Changes

- `pnpm install`: PASS.
- `pnpm --filter @community-os/admin-web lint -- --quiet`: PASS.
- `pnpm --filter @community-os/api lint -- --quiet`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS.
- `pnpm --filter @community-os/admin-web build`: PASS.
- `pnpm --filter @community-os/admin-web test:browser-console`: PASS.
- `pnpm audit --audit-level moderate --json`: 0 critical, 0 high, 2 moderate, 3 low.

## RC Decision

Dependency security is no longer an RC blocker for high or critical advisories. The remaining moderate advisories are documented as non-blocking for this RC based on reachability and environment classification.
