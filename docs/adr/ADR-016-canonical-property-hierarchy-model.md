# ADR-016: Canonical Property Hierarchy Model

## Status

Accepted

## Context

Residential properties vary from single-building societies to 10,000+ unit townships with sectors, towers, wings, and villa enclaves.

## Decision

Establish a canonical domain hierarchy:
`Platform → Organization → Portfolio? → Community → CommunitySection? → Building? → Floor? → Unit`.

## Consequences

- **Positive**: Provides a single coherent domain schema capable of modeling any real-world community typology without database schema adjustments.
- **Negative**: Requires strict domain validation services to handle optional and skipped hierarchy tiers.
