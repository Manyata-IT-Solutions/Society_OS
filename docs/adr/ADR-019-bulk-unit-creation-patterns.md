# ADR-019: Bulk Unit Creation Patterns

## Status

Accepted

## Context

Residential towers frequently contain hundreds of repetitive units across identical floor plates (e.g. Floors 1 to 20 each with units 01 to 06). Manual entry is error-prone and tedious for administrators.

## Decision

Implement a structured pattern generation engine (`BulkUnitService`) that accepts floor ranges, suffix arrays, and specification presets, executing validation and batch insert in database transactions.

## Consequences

- **Positive**: Enables generation of hundreds of units in sub-second execution time.
- **Negative**: Must pre-validate duplicate unit collisions across the entire batch before beginning insertion.
