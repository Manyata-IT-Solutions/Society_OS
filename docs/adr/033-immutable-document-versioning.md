# ADR 033: Immutable Document Versioning

## Status

Accepted

## Context

Legal, compliance, and governance documents must retain previous revision states without destructive in-place file overwrites.

## Decision

Every document version upload generates an immutable `DocumentVersion` row incrementing `versionNumber` (1, 2, 3...) and updating `currentVersionId`. Prior versions are preserved in perpetuity unless explicitly purged by retention policy.

## Consequences

### Positive

- Complete historical audit trail and ability to inspect previous revisions.

### Negative

- Higher object storage consumption over time.
