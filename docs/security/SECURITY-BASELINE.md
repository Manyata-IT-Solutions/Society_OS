# COMMUNITY OS — SECURITY BASELINE REPORT

**Phase 26 — Enterprise Hardening & Security Baseline**

---

## 1. Architecture & Security Context

Community OS is an enterprise-grade, multi-tenant modular monolith for residential gated communities, commercial townships, and property portfolios. The platform spans 25 bounded contexts implemented in TypeScript (NestJS API, Next.js Admin Web, Prisma ORM on PostgreSQL, Redis, BullMQ, and event-driven domains).

### 1.1 Multi-Tenant Isolation Model
The platform employs a hierarchical scoped tenancy model:
`PLATFORM` -> `ORGANIZATION` -> `PORTFOLIO` -> `COMMUNITY` -> `SECTION / BUILDING / UNIT` -> `OWN (RESIDENT / USER)`

- **Tenant Identifiers**: All tenant-owned database tables include `organizationId` and/or `communityId` foreign keys indexed with composite unique constraints.
- **Server-Side Context Resolution**: The active tenant context is derived server-side via `AuthGuard`, `TenantContextMiddleware`, and `PermissionGuard` rather than blindly trusting client-supplied headers.

### 1.2 Authentication & Session Architecture
- **Password Hashing**: Bcrypt with salt rounds = 12.
- **Access Tokens**: Short-lived JWT access tokens (15-minute expiry) signed with HMAC-SHA256, carrying minimal subject claims (`sub`, `email`, `displayName`, `isPlatformAdmin`, `sessionId`).
- **Refresh Tokens & Sessions**: 30-day rotating refresh tokens stored hashed with SHA-256 in the PostgreSQL `sessions` table. Every API request verifies that the underlying session has not been revoked (`revokedAt IS NULL`) and has not expired, providing instant session revocation.
- **Role-Based Access Control (RBAC)**: Centralized `evaluateScopedPermission` engine supporting 426 granular permissions evaluated against subject role assignments with deny-by-default semantics.

---

## 2. Attack Surface Analysis

| Surface / Boundary | Description | Key Security Controls |
| :--- | :--- | :--- |
| **Public REST API** | `/api/v1/*` endpoints consumed by Web and mobile clients. | Global `AuthGuard`, `PermissionGuard`, `ValidationPipe` (whitelist + forbidNonWhitelisted), rate limits. |
| **Authentication Endpoints** | `/api/v1/auth/login`, `/refresh`, `/sessions` | Bcrypt password verification, SHA-256 refresh token hashing, session revocation, Redis rate limits. |
| **Document Storage & File Transfers** | Document upload, download, versioning, and presigned streaming. | `LocalDiskStorageProvider` safe path resolution (preventing directory traversal), classification-based RBAC, non-guessable storage keys. |
| **Financial Posting Engine** | General Ledger, AR, AP, Treasury, and Maintenance Billing. | Immutable posted journals, double-entry balanced enforcement, period controls, reversal-only auditing. |
| **Gate Access & Physical Security** | QR validation, OTP verification, visitor passes, vehicle logging. | Single-use pass validation inside atomic `$transaction`, SHA-256 credential hashing, gate-scoped authorization. |
| **Analytics & Governed AI** | Natural-language assistant, document Q&A, KPI query engine. | Strict tenant filtering before query execution, prompt injection defense, structured semantic query generation (no arbitrary raw SQL). |
| **Admin Web Frontend** | Next.js server-rendered and client components. | Helmet security headers, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `poweredByHeader: false`. |

---

## 3. Security Findings & Risk Classification

### 3.1 Finding Summary

| Severity | Count | Status |
| :--- | :---: | :--- |
| **CRITICAL** | 0 | None identified |
| **HIGH** | 2 | Resolved |
| **MEDIUM** | 4 | Resolved |
| **LOW** | 3 | Resolved |
| **INFORMATIONAL** | 2 | Documented |

---

### 3.2 Detailed Findings & Remediations

#### [HIGH-01] AI Assistant Unscoped Cross-Tenant Aggregation
- **Description**: The AI assistant service (`AIPlatformService`) performed unscoped database queries for collection metrics when `communityId` / `organizationId` were omitted in the request.
- **Remediation**: Enforce mandatory tenant scoping in `AIPlatformService` and `AnalyticsQueryEngineService` using server-resolved actor tenant context.

#### [HIGH-02] IAM Role Assignment Privilege Boundary Gaps
- **Description**: While `PLATFORM` scope was protected, Organization Admins were not strictly bounded from creating assignments in other organizations if request body parameters were manipulated.
- **Remediation**: Added explicit privilege boundary validation in `RoleAssignmentsService` ensuring actors can only grant roles within their verified tenant scope.

#### [MEDIUM-01] CSV Formula Injection Risk in Export Endpoints
- **Description**: User-controlled text fields exported into CSV format without character escaping could execute arbitrary spreadsheet formulas (`=`, `+`, `-`, `@`).
- **Remediation**: Added `sanitizeCsvFormula` helper prefixing special formula trigger characters with a single apostrophe.

#### [MEDIUM-02] Logging Redaction Scope Expansion
- **Description**: Standard logger redacted passwords and tokens, but bank accounts, IFSC codes, UPI pins, and raw QR pass tokens needed explicit inclusion in `SENSITIVE_LOG_KEYS`.
- **Remediation**: Updated `packages/logger/src/redaction.ts` to include all banking, financial, and security credential keys.

#### [MEDIUM-03] Next.js Extended Security Headers
- **Description**: Web application included basic frame options but lacked explicit `Permissions-Policy` and Content Security Policy directives.
- **Remediation**: Updated `apps/admin-web/next.config.js` to enforce strict security headers and CSP rules.

#### [MEDIUM-04] Production Demo Credential Startup Guard
- **Description**: Demo credentials seeded during development must not be operable or generated automatically in production environments.
- **Remediation**: Added startup environment validation in `ConfigService` rejecting demo seeds when `NODE_ENV=production`.

---

## 4. Security Baseline Verification

The security baseline has been audited and validated through dedicated automated test suites covering tenant isolation, privilege escalation, IDOR, finance immutability, gate replay, file access, and AI security.
