# Community OS — Docker Deployment & Operations Guide

This guide details the dual-mode Docker architecture for **Community OS**, providing complete separation between **Local Development** and **Production Server Deployment (ARM64 / Linux)**.

---

## 1. Architectural Overview

```text
====================================================================================
DEVELOPMENT ARCHITECTURE (Local Host)
====================================================================================
Host Machine (Windows / macOS / Linux)
├── [Port 3000] ──> Admin Web (Next.js Dev Server + Watchpack Polling + Host Mounts)
├── [Port 4000] ──> NestJS API (Nest CLI Watcher + Host Mounts + Swagger UI)
├── [Port 5434] ──> PostgreSQL 16 (Exposed for Prisma Studio / local tools)
└── [Port 6379] ──> Redis 7 (Exposed for local inspection)

====================================================================================
PRODUCTION ARCHITECTURE (ARM64 / Linux Server)
====================================================================================
Internet (Port 80 / 443)
       │
       ▼
   Nginx Reverse Proxy
   ├── Location /api/v1 ──> http://127.0.0.1:4000 (NestJS Production Runner)
   │                           ├── postgres:5432 [INTERNAL ONLY - ZERO HOST PORTS]
   │                           └── redis:6379    [INTERNAL ONLY - ZERO HOST PORTS]
   └── Location /       ──> http://127.0.0.1:3000 (Next.js Production Runner)
```

---

## 2. Configuration & File Separation

| Purpose | Compose File | Dockerfiles | Env File | Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Local Dev** | `docker-compose.yml`<br>`docker-compose.dev.yml` | `Dockerfile.api`<br>`Dockerfile.web` | `.env` | Hot reload, host volume mounts, dev watchers, dev ports open |
| **Production** | `docker-compose.prod.yml` | `Dockerfile.api.prod`<br>`Dockerfile.web.prod` | `.env.production` | Multi-stage builds, zero bind mounts, internal DB/Redis, non-root user, minimal RAM |

---

## 3. Local Development Workflow

### Start Development Stack
```bash
# Standard background start:
docker compose up -d

# Or rebuild images with live logs:
docker compose up --build

# Or with full monorepo packages hot reload:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Stop Development Stack
```bash
docker compose down

# To also clear development database and redis volumes:
docker compose down -v
```

### View Development Logs
```bash
docker compose logs -f
# Or specific services:
docker compose logs -f api
docker compose logs -f admin-web
```

### Development Database Operations
```bash
# Seed realistic demo data inside container:
docker compose exec api pnpm demo:seed

# Run development migrations:
docker compose exec api pnpm db:migrate
```

---

## 4. Production Deployment Workflow (ARM64 / Linux)

### Step 1: Prepare Production Secrets
Copy the production template and set cryptographically secure credentials:
```bash
cp .env.production.example .env.production
chmod 600 .env.production
```
Edit `.env.production`:
* Set strong `DATABASE_PASSWORD` and `REDIS_PASSWORD` (generate with `openssl rand -hex 24`).
* Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (generate with `openssl rand -base64 32`).
* Set `CORS_ORIGINS` to your exact production domain (e.g., `https://society.yourdomain.com`).
* Set `NEXT_PUBLIC_API_URL` to `/api/v1` (recommended for same-origin reverse proxy) or `https://api.yourdomain.com/api/v1`.

### Step 2: Build Production Docker Images
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build
# Or via root pnpm helper:
pnpm docker:prod:build
```

### Step 3: Start Production Stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
# Or via root pnpm helper:
pnpm docker:prod:up
```

### Step 4: Run Prisma Production Migrations
Apply schema migrations safely without resetting data:
```bash
docker compose -f docker-compose.prod.yml exec api \
  pnpm --filter @community-os/database db:deploy
# Or via root pnpm helper:
pnpm docker:prod:migrate
```

### Step 5: Verify Running Production Containers
```bash
docker compose -f docker-compose.prod.yml ps
```
Expected output:
```text
NAME                         STATUS                    PORTS
community_os_postgres_prod   Up (healthy)              [internal]
community_os_redis_prod      Up (healthy)              [internal]
community_os_api_prod        Up (healthy)              127.0.0.1:4000->4000/tcp
community_os_admin_web_prod  Up (healthy)              127.0.0.1:3000->3000/tcp
```

### Step 6: View Production Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Step 7: Stop Production Stack
```bash
docker compose -f docker-compose.prod.yml down
# Or via root pnpm helper:
pnpm docker:prod:down
```

---

## 5. Production Nginx Reverse Proxy Configuration

Place this configuration in `/etc/nginx/sites-available/community-os`:

```nginx
server {
    listen 80;
    server_name society.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name society.example.com;

    ssl_certificate /etc/letsencrypt/live/society.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/society.example.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression for low bandwidth
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 1. API Route Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # 2. Next.js Static Cache Optimization
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 3. Frontend Web Application Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Security & Low-Resource Server Checklist

- [x] **Zero Database Public Exposure**: PostgreSQL (`5432`) and Redis (`6379`) are reachable strictly over `community_os_network_prod`.
- [x] **Non-Root Execution**: Both API and Web production containers drop root and execute as user `node` (`uid: 1000`).
- [x] **Small Image Footprint**: Multi-stage builds strip devDependencies (`typescript`, `@types/*`, `jest`, `vitest`, `playwright`), shrinking images by > 75%.
- [x] **Zero Dev Watchers in Production**: No `nest start --watch`, `next dev`, or `WATCHPACK_POLLING` running in production, reducing RAM usage to < 350 MB.
- [x] **Immutable Migrations**: Uses `prisma migrate deploy` which executes only verified schema migrations and rejects destructive resets.
- [x] **ARM64 Native Execution**: All base images (`node:20-alpine`, `postgres:16-alpine`, `redis:7-alpine`) and Prisma Alpine libraries (`libc6-compat`, `openssl`) run natively on Linux ARM64 / aarch64.
