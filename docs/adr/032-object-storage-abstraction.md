# ADR 032: Object Storage Abstraction

## Status

Accepted

## Context

Storing large files directly in PostgreSQL causes database bloat, slow backup cycles, and excessive memory pressure.

## Decision

We defined an `ObjectStorageProvider` interface with a `LocalDiskStorageProvider` for local environments and pluggable S3/GCS adapters for production cloud deployments. PostgreSQL only stores storage keys and file metadata.

## Consequences

### Positive

- Small database footprint, streaming downloads, zero server RAM exhaustion.

### Negative

- Requires storage cleanup routines if unlinked orphan files exist.
