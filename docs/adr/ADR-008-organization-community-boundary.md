# ADR-008: Organization vs Community Aggregate Boundary

## Status

Accepted

## Context

Residential community software must serve diverse operational scales: from a single independent housing society with 50 units, to a large property management enterprise managing 50 gated communities across multiple cities. We must define the canonical structural boundary between enterprise customer accounts and individual properties.

## Decision

1. **`Organization` is the Root Customer / Enterprise Account**:
   - Represents the commercial and legal customer (e.g., Property Management Corporation, Housing Board, RWA Apex Society).
   - Holds billing relationships, subscription tiers, enterprise default settings (currency, timezone, locale).
2. **`Community` is the Property / Complex Aggregate**:
   - Represents an individual physical society, gated township, or residential complex.
   - Belongs to exactly one `Organization` (`organizationId` foreign key is mandatory and non-nullable).
   - Has its own physical address, local operating timezone, and short code unique within its organization.
3. **Canonical Terminology**:
   - The platform uses `Community` internally rather than "Society" to ensure international applicability (e.g. HOA, Condominium, Residential Estate, Township).

## Consequences

- **Positive**: Clean enterprise multi-society support from Day 1.
- **Hierarchical Scalability**: Future tiers (`Portfolio`, `Cluster`, `Tower`, `Unit`) nest neatly under this foundational boundary.
