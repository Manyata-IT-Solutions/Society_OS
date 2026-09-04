# ADR 036: Document Classification Security

## Status

Accepted

## Context

Community documents range from public guidelines to confidential financial statements and restricted legal dispute files.

## Decision

All documents carry an explicit `DocumentClassification` (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`). The `DocumentAuthorizationService` strictly checks actor clearance and permissions (`document.manage_restricted`) before serving metadata or file streams.

## Consequences

### Positive

- Strict least-privilege protection against cross-role data leaks.
