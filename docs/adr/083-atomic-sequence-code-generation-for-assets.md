# ADR 083: Atomic Sequence Code Generation for Assets

## Status

Accepted

## Context

Physical assets require human-friendly, sequentially numbered identifier codes (e.g., `AST-2026-000001`) that are unique within each organization and community.
Generating sequence codes via `SELECT COUNT(*)` or `MAX(id)` causes race conditions and duplicate key collisions under concurrent onboarding.

## Decision

1. **Postgres Atomic Sequences**: Sequences are generated atomically using dedicated database sequence mechanisms (`AssetSequenceService`) scoped to `organizationId`, `communityId`, and year.
2. **Standard Format**: All asset codes follow the pattern `AST-<YYYY>-<######>` with 6-digit zero padding.
3. **Optimistic Retry Guarantee**: If a collision occurs during bulk import, the sequence service automatically increments and retries within a transactional boundary.

## Consequences

- Concurrency-safe asset creation across web and bulk import APIs.
- Predictable, auditable numbering for physical tags and inventory audits.
