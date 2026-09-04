# ADR 031: Document Core Architecture

## Status

Accepted

## Context

Organizations and communities manage diverse legal documents, bylaws, ownership deeds, resident identity proofs, and maintenance contracts that require strict versioning and access controls.

## Decision

We established `DocumentCore` as an enterprise platform service featuring:

1. Object storage abstraction (`ObjectStorageProvider`).
2. Immutable document versions (`DocumentVersion`).
3. Polymorphic resource linking (`DocumentLink`).
4. Classification-based authorization (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`).
5. SHA-256 checksum verification and quarantine states.

## Consequences

### Positive

- High storage efficiency, strong security guarantees, and full revision traceability.
- Modules attach documents uniformly via `DocumentLink`.

### Negative

- Direct relational deletion of parent resources must cascade link unlinking safely.
