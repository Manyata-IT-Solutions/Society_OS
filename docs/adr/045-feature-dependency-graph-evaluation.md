# ADR 045: Feature Dependency Graph Evaluation

## Status

Accepted

## Context

Higher-level features (such as `feature.advancedAnalytics` or `feature.documentWorkflows`) inherently depend on underlying baseline features (`feature.documentLibrary`, `feature.residentPortal`). Enabling a dependent feature without its prerequisite leads to broken UI states or unhandled API exceptions.

## Decision

We formalized explicit feature dependencies in the `FeatureRegistry`:

1. Each feature definition declares optional `dependencies: string[]` (e.g., `feature.documentWorkflows` requires `['feature.documentLibrary']`).
2. During resolution in `FeatureResolverService.resolve(...)`, all declared dependencies are recursively resolved.
3. If any required dependency is disabled (`false`), the dependent feature is automatically evaluated to `enabled: false` with `dependenciesMet: false` and a human-readable `reason` explaining the missing prerequisite.

## Consequences

### Positive

- Prevents invalid runtime feature states and broken user interfaces.
- Automatic entitlement dependency enforcement across platform, organization, and community tiers.
- Transparent reason propagation to frontend clients.

### Negative

- Resolution order must evaluate or memoize prerequisite features to prevent redundant recursive resolution.
