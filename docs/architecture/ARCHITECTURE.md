# System Architecture: Community OS

## 1. Architectural Philosophy

Community OS is designed to be the definitive platform for community operations, facility management, resident experience, accounting, and security.

To ensure extreme software longevity without rewriting:

1. **Modular Monolith**: We enforce strict compile-time and runtime modularity within a unified repository and deployment unit. No premature microservices.
2. **Domain-Driven Design (DDD)**: Business logic belongs in rich domain services and entities, strictly decoupled from database ORM models and HTTP controllers.
3. **Internal Event-Driven Architecture**: Cross-module workflows communicate asynchronously via typed events, preventing tight coupling between bounded contexts.
4. **Configure, Do Not Customize**: Society-specific policies, SLAs, approval hierarchies, and workflows are dynamic configurations executed by platform engines rather than custom code branches.
5. **Multi-Tenancy by Design**: Every request, entity, query, and background job is inherently tenant-scoped.

---

## 2. Layering Architecture

```
Layer 1: Experience Applications (Web, Future Mobile, Vendor Portal)
   ↓
Layer 2: API / Gateway / Ingress Layer (Routing, Versioning, Auth, Rate Limiting, Validation)
   ↓
Layer 3: Application & Workflow Layer (Use cases, orchestrations, policy evaluation)
   ↓
Layer 4: Domain Layer (Pure business logic, domain events, business invariants)
   ↓
Layer 5: Platform & Core Services (Observability, Logger, Config, Event Bus, Auth Context)
   ↓
Layer 6: Infrastructure & Persistence (Prisma Repositories, PostgreSQL 16, Redis 7, Object Storage)
```

### Layer Rules

- **Dependencies point strictly downwards**. Domain logic cannot import from controllers or infrastructure packages.
- **Controllers** are thin adapters converting HTTP requests to DTOs, invoking Application/Domain services, and returning standard envelopes.
- **Database models** are isolated within the infrastructure layer behind `IRepository` interfaces.

---

## 3. Communication Patterns

1. **Synchronous Query/Command within a Module**: Direct service invocations through dependency injection.
2. **Cross-Module Communication**:
   - Primary: Publish typed Domain / Integration Events via `IEventBus`.
   - Secondary: Interface-based Contract Services with explicit DTOs. Direct database queries into another domain's tables are forbidden.
3. **Asynchronous Background Processing**: Offloaded to Redis-backed job queues (BullMQ) for reliable execution with retries and dead-letter queues.

---

## 4. Technology Stack Justification

| Technology           | Selected Version         | Role                                         |
| :------------------- | :----------------------- | :------------------------------------------- |
| **Node.js**          | `>= 20.0.0 (Active LTS)` | Runtime environment                          |
| **pnpm + Turborepo** | `pnpm 10.x, Turbo 2.x`   | Monorepo and pipeline caching                |
| **TypeScript**       | `5.8.x`                  | Static typing in strict mode                 |
| **NestJS**           | `10.4.x`                 | Backend modular architecture                 |
| **Next.js**          | `14.2.x`                 | Server-rendered admin web console            |
| **PostgreSQL**       | `16.x`                   | Authoritative transactional system of record |
| **Prisma ORM**       | `6.4.x`                  | Typesafe database client & migrations        |
| **Redis**            | `7.x`                    | Cache, distributed locking, queues           |
| **Pino**             | `9.6.x`                  | High-throughput structured logging           |
| **Zod**              | `3.24.x`                 | Runtime schema validation & sanitization     |
