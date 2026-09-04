# ADR-001: Monorepo Tooling with pnpm Workspaces and Turborepo

## Status

Accepted

## Context

Community OS comprises multiple experience applications (Admin Web, future mobile apps, portals) and core backend services sharing common data models, validation schemas, API contracts, and observability tooling. We need a repository architecture that provides:

1. Fast, deterministic dependency installation without duplicate disk overhead.
2. Safe code sharing and refactoring across frontend and backend boundaries.
3. High-performance task execution with computation caching for CI and local workflows.

## Decision

We adopt a **Monorepo** managed with **pnpm workspaces** and orchestrated by **Turborepo**.

- **pnpm**: Uses a content-addressable store and strict symlinks/hardlinks, preventing phantom dependencies and saving disk space.
- **Turborepo**: Provides dependency graph orchestration, parallel execution, and remote caching capabilities.

## Alternatives Considered

- **Polyrepo (Multiple Repositories)**: Rejected due to excessive overhead in synchronizing shared types, contracts, and linting rules across 10+ repositories.
- **npm / Yarn workspaces**: Rejected due to slower resolution speeds, looser dependency hoisting, and higher disk footprints compared to pnpm.
- **Nx**: Considered, but Turborepo provides simpler configuration and minimal abstraction overhead for TypeScript-first monorepos.

## Consequences

- **Positive**: Single PR can update backend contracts and frontend consumers simultaneously; single unified CI pipeline; fast builds via Turbo cache.
- **Negative**: Monorepo size will grow over time; team must adhere to clean package boundary rules.
