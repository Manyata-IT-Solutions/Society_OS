# ADR 039: Configuration Engine & Scope Hierarchy

## Status

Accepted

## Context

Different organizations and communities require distinct operational settings (e.g., timezone, currency, date formats, invoice prefixes, auto-approval thresholds) without modifying application code or maintaining custom code forks.

## Decision

We implemented a canonical in-memory `ConfigurationRegistry` combined with a hierarchical resolution engine:

1. `Platform Default`: Base default registered in code with strict schema/valueType constraints.
2. `Organization Override`: Overrides platform defaults for all communities within an organization.
3. `Community Override`: Most specific override taking ultimate precedence for a specific community.

When resolving configuration, the resolver checks `Community -> Organization -> Platform Default`. Unset keys inherit cleanly from their parent scope without data duplication. Deleting an override immediately restores parent inheritance.

## Consequences

### Positive

- Strict "Configure, Do Not Customize" architectural enforcement.
- Type-safe, validated configuration values.
- Clean inheritance with optimistic concurrency control (`version` check).

### Negative

- Multi-tier resolution requires caching in Redis to prevent redundant database queries on hot paths.
