# ADR-015: Portfolio Layer for Enterprise Grouping

## Status

Accepted

## Context

Enterprise property management organizations frequently oversee hundreds of communities categorized across geographical regions, property brands, or operating divisions.

## Decision

Introduce an optional `Portfolio` entity scoped under `Organization`. Communities can optionally reference a `portfolioId` to allow enterprise-level rollup reporting and portfolio-scoped access control.

## Consequences

- **Positive**: Enables multi-community aggregation without altering the fundamental Organization-Community root architecture.
- **Negative**: Adds an additional optional relational link to the `Community` model.
