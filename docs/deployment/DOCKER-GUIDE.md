# COMMUNITY OS — DOCKER DEPLOYMENT & DEVELOPMENT GUIDE

This guide explains how to run the entire **Community OS** stack (PostgreSQL, Redis, NestJS API, Next.js Web Admin) entirely inside Docker.

---

## 1. Quick Start: Running Everything via Docker

### Start all 4 containers in the background:
```bash
pnpm docker:up
# Or directly with Docker Compose:
docker compose up -d
```

### Start with live hot-reloading development (Host Code Mounts):
```bash
pnpm docker:dev
# Or directly with Docker Compose:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 2. Service Endpoints

| Container / Service | Internal Port | Host URL | Description |
| :--- | :---: | :--- | :--- |
| **Next.js Admin Web** (`admin-web`) | 3000 | [http://localhost:3000](http://localhost:3000) | Web Dashboard & Resident Management UI |
| **NestJS API Service** (`api`) | 4000 | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Backend REST API & Event Bus |
| **Swagger API Docs** | 4000 | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) | Interactive OpenAPI / Swagger documentation |
| **PostgreSQL 16** (`postgres`) | 5432 | `localhost:5434` | Primary Relational Database |
| **Redis 7** (`redis`) | 6379 | `localhost:6379` | In-Memory Cache & Distributed Locks |

---

## 3. Database Operations inside Docker

### Seed Demo Dataset inside Docker:
```bash
docker compose exec api pnpm demo:seed
```

### Run Database Migrations:
```bash
docker compose exec api pnpm db:migrate
```

### Open PostgreSQL CLI inside container:
```bash
docker compose exec postgres psql -U postgres -d community_os_dev
```

---

## 4. Stopping & Managing Containers

### View real-time logs across all services:
```bash
pnpm docker:logs
# Or for a specific service:
docker compose logs -f api
docker compose logs -f admin-web
```

### Stop all containers:
```bash
pnpm docker:down
# Or:
docker compose down
```

### Clean reset (stops containers and removes data volumes):
```bash
docker compose down -v
```
