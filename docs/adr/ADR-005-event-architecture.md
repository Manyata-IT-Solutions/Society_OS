# ADR-005: Internal Event-Driven Architecture & Domain Events

## Status

Accepted

## Context

In a modular monolith, business workflows frequently span multiple domain boundaries. For example, when a `payment.received` event occurs, the system must update invoices in `Finance`, notify the resident in `Notification`, and activate gate access tags in `Security`. Direct point-to-point method invocation across 5 domains creates spaghetti dependencies.

## Decision

We implement a **Strongly-Typed Internal Event-Driven Architecture** via `@community-os/events`:

1. Every event has a standard envelope (`eventId`, `eventName`, `version`, `timestamp`, `correlationId`, `tenantId`, `payload`).
2. Modules publish domain events through the `IEventBus` interface.
3. In Phase 0, the event bus runs an in-memory asynchronous dispatcher.
4. The `IEventBus` abstraction allows seamless swapping to Redis Pub/Sub, BullMQ, or Kafka without changing domain logic when scaling demands it.

## Alternatives Considered

- **Direct Synchronous Method Calls Across Modules**: Rejected. Leads to circular dependencies and fragile transaction boundaries.
- **Kafka / RabbitMQ in Phase 0**: Rejected. Introducing distributed messaging brokers at bootstrap adds unnecessary infrastructure complexity and operational overhead.

## Consequences

- **Positive**: Low coupling between business domains; full audit traceability; easy to add new reactive workflows (e.g. audit loggers, analytics, notifications) without modifying existing domain code.
- **Negative**: Requires eventual consistency considerations for cross-module side effects.
