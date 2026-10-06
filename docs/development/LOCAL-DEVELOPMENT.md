# Local Development Guide

## 1. System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2 / PowerShell)
- **Node.js**: `v20.x` or `v22.x` (Active LTS)
- **pnpm**: `v9.x` or `v10.x` (`corepack enable` or `npm i -g pnpm`)
- **Docker Desktop / Docker Engine**: `v24+`

---

## 2. Getting Started (Step-by-Step)

```bash
# 1. Clone repository
git clone <repo-url> community-os
cd community-os

# 2. Install workspace dependencies
pnpm install

# 3. Create local environment configuration
cp .env.example .env

# 4. Start PostgreSQL 16 and Redis 7 background containers
pnpm docker:up

# 5. Generate Prisma ORM client
pnpm db:generate

# 6. Apply database schema / migrations
pnpm db:migrate

# 7. Start all applications in development mode
pnpm dev
```

---

## 3. Ports & Service Endpoints

| Service               | Port   | Local URL                        | Description                |
| :-------------------- | :----- | :------------------------------- | :------------------------- |
| **Admin Web App**     | `3000` | `http://localhost:3000`          | Next.js Management Console |
| **REST API Engine**   | `4000` | `http://localhost:4000/api/v1`   | NestJS Core Backend API    |
| **API Documentation** | `4000` | `http://localhost:4000/api/docs` | Swagger / OpenAPI UI       |
| **PostgreSQL**        | `5432` | `localhost:5432`                 | Database Server            |
| **Redis**             | `6379` | `localhost:6379`                 | In-memory Cache & Queues   |

---

## 4. Running Quality Checks Locally

```bash
# Run linting
pnpm lint

# Automatically fix linting violations
pnpm lint:fix

# Run strict TypeScript compiler verification
pnpm typecheck

# Run unit and integration tests
pnpm test

# Format all source files with Prettier
pnpm format
```

---

## 5. Troubleshooting Common Issues

### Port Conflicts (Port 5432 or 6379 already in use)

If you have a local PostgreSQL or Redis service already running on your host:

- Update `DATABASE_PORT` and `REDIS_PORT` in `.env` (e.g., `DATABASE_PORT=5433`).
- Re-run `pnpm docker:up`.

### Database Reset

To completely tear down the local database and re-seed from scratch:

```bash
docker compose down -v
pnpm docker:up
pnpm db:migrate
```
