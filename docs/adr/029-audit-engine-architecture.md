# ADR 029: Enterprise Audit Engine Architecture

## Status

Accepted

## Context

Enterprise community operations require an immutable, append-only audit trail for compliance, dispute resolution, security forensics, and tenant oversight.

## Decision

We implemented a dedicated `AuditEngine` with:

1. Append-only `AuditRecord` model.
2. Automated asynchronous domain event projection via `AuditEventSubscriberService`.
3. Deep recursive sensitive data masking.
4. Tenant and resource-scoped query filtering.
5. CSV export with formula injection sanitization.

## Consequences

### Positive

- Strict auditability across all modules without code repetition.
- Regulatory compliance and tamper evidence.
- Safe exports and zero credential leak risk.

### Negative

- Asynchronous projection adds minor ingestion latency (sub-second).
