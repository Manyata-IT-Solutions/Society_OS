# Community OS

> Enterprise Residential Community ERP, Society Management Platform, Facility Management System, and Multi-Property SaaS Operating System.

[![CI Pipeline](https://github.com/community-os/community-os/actions/workflows/ci.yml/badge.svg)](https://github.com/community-os/community-os/actions/workflows/ci.yml)
[![License: UNLICENSED](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6.svg)](tsconfig.json)

---

## Architecture Summary

Community OS is engineered as a **Modular Monolith** employing **Domain-Driven Design (DDD)**, an **Internal Event-Driven Architecture**, and **Strict Server-Side Multi-Tenancy**. It supports small societies, premium gated communities, and 10,000+ unit townships across multiple organizations and cities without code customization per client.

```
┌─────────────────────────────────────────────────────────────┐
│                 Experience Applications                      │
│        apps/admin-web  •  (Future Mobile & Portals)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / OpenAPI
┌──────────────────────────────▼──────────────────────────────┐
│                    API / Gateway Layer                      │
│      RequestId • TenantContext • AuthGuard • Validation     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   Domain Modules Layer                      │
│  Identity • Organization • Property • Finance • Helpdesk    │
│  (Inter-module communication via contracts & domain events) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Platform Core Services                     │
│  @community-os/config • events • logger • observability     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Infrastructure & Storage                   │
│   PostgreSQL 16 (System of Record) • Redis 7 (Cache/Queue)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
community-os/
├── apps/
│   ├── admin-web/              # Next.js App Router (ERP Console Shell)
│   └── api/                    # NestJS REST API Engine (/api/v1)
├── packages/
│   ├── auth/                   # RBAC, Scoped permissions, Tenant memberships
│   ├── config/                 # Validated environment loader
│   ├── contracts/              # Shared DTOs and API contract schemas
│   ├── database/               # Prisma ORM, migrations, seeders, repository interfaces
│   ├── eslint-config/          # Standard monorepo ESLint rules
│   ├── events/                 # Strongly-typed event bus and event envelopes
│   ├── logger/                 # Pino structured logger with automatic PII/secret redaction
│   ├── observability/          # AsyncLocalStorage request tracing and telemetry context
│   ├── tsconfig/               # Shared strict TypeScript base configs
│   ├── types/                  # Core domain, API envelope, and pagination interfaces
│   └── validation/             # Zod runtime schemas and sanitization rules
├── infrastructure/
│   ├── database/               # PostgreSQL initialization SQL
│   └── docker/                 # Container definitions
├── docs/                       # Architecture, Security, Database, and ADRs
├── docker-compose.yml          # PostgreSQL 16 + Redis 7 local stack
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Quickstart

### 1. Prerequisites

- **Node.js**: `>= 20.0.0` (Active LTS recommended)
- **pnpm**: `>= 9.0.0`
- **Docker & Docker Compose**

### 2. Setup Environment

```bash
# Clone repository
git clone <repo-url> community-os
cd community-os

# Install dependencies across all workspaces
pnpm install

# Copy environment template
cp .env.example .env
```

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL (port 5432) and Redis (port 6379)
pnpm docker:up
```

### 4. Initialize Database

```bash
# Generate Prisma Client & apply schema
pnpm db:generate
```

### 5. Run Development Servers

```bash
# Concurrently runs apps/api and apps/admin-web
pnpm dev
```

- **Admin Web Console**: [http://localhost:3000](http://localhost:3000)
- **REST API**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **Swagger OpenAPI Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Standard Commands Catalog

| Command              | Action                                                         |
| :------------------- | :------------------------------------------------------------- |
| `pnpm dev`           | Run all applications in local development mode with hot-reload |
| `pnpm build`         | Compile all packages and build production distributions        |
| `pnpm lint`          | Run ESLint across all apps and packages                        |
| `pnpm lint:fix`      | Automatically fix ESLint format and rule violations            |
| `pnpm typecheck`     | Run strict TypeScript compiler checks across all workspaces    |
| `pnpm test`          | Execute all unit and integration test suites                   |
| `pnpm test:coverage` | Run test suites and generate coverage reports                  |
| `pnpm format`        | Run Prettier across all files                                  |
| `pnpm db:generate`   | Generate Prisma ORM client artifacts                           |
| `pnpm db:migrate`    | Apply Prisma schema migrations                                 |
| `pnpm db:studio`     | Open Prisma Studio database management GUI                     |
| `pnpm docker:up`     | Start background PostgreSQL and Redis containers               |
| `pnpm docker:down`   | Stop background containers                                     |

---

## Documentation Links

- **[Architecture Overview](docs/architecture/ARCHITECTURE.md)**
- **[Multi-Tenancy Architecture](docs/architecture/MULTI-TENANCY.md)**
- **[Domain Module Boundaries](docs/architecture/MODULE-BOUNDARIES.md)**
- **[Backup & Disaster Recovery](docs/architecture/BACKUP-RECOVERY.md)**
- **[Security Baseline](docs/security/SECURITY-BASELINE.md)**
- **[Database Guidelines](docs/database/DATABASE-GUIDELINES.md)**
- **[Coding Standards & Git Guidelines](docs/development/CODING-STANDARDS.md)**
- **[Architecture Decision Records (ADRs)](docs/adr/)**
