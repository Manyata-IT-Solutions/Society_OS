# ADR-002: Modular Monolith vs Microservices Architecture

## Status

Accepted

## Context

Residential community ERP and facility management platforms encompass numerous business domains (Identity, Property, Accounting, Helpdesk, Visitors, Assets, Governance). Early-stage microservice architectures often suffer from distributed transaction failures, network latency overhead, severe operational complexity, and premature domain boundary friction.

## Decision

We select a **Modular Monolith** architecture with strict **Domain-Driven Design (DDD)** and internal event-driven boundaries.

- All modules live within the NestJS unified API engine (`apps/api`).
- Domains communicate through strictly defined interfaces and asynchronous typed domain events (`@community-os/events`).
- Cross-domain direct database queries or schema coupling are prohibited.

## Alternatives Considered

- **Microservices from Day 1**: Rejected. Incurs massive infrastructure overhead (service mesh, distributed tracing, Kubernetes, saga managers, independent deployment pipelines) before business domain boundaries are fully hardened.
- **Traditional Monolith (Unstructured)**: Rejected. Leads to spaghetti code, tight coupling, and eventual need for complete rewrites.

## Consequences

- **Positive**: Simple local development, unified deployments, transactional consistency where appropriate, zero distributed network overhead.
- **Positive**: Modular boundaries ensure that if a specific high-load service (e.g. Visitor Gate IoT) requires independent scaling in the future, it can be extracted into an independent microservice with near-zero refactoring.
- **Negative**: Requires strict architectural governance to prevent developers from bypassing module interfaces.
