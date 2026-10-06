# ADR 046: Configure, Do Not Customize Principle

## Status

Accepted

## Context

Multi-tenant enterprise SaaS systems frequently degrade in maintainability when custom branches, bespoke client code forks, dynamic server-side scripts (`eval`), or hardcoded `if (communityId === ...)` conditionals are introduced to satisfy client-specific requirements.

## Decision

We establish the non-negotiable architectural rule: **"Configure, Do Not Customize"**.

1. All client-specific behavioral variations MUST be accommodated via:
   - Typed Configuration Catalog (`ConfigurationRegistry`).
   - Feature Entitlement Flags (`FeatureRegistry`).
   - Tenant-Scoped Dynamic Custom Fields (`CustomFieldDefinition`).
   - Display & Terminology Settings (`TerminologyService`).
2. No client-specific code branches, no tenant ID conditionals in core service logic, and no insecure dynamic script execution engines are permitted in Community OS.

## Consequences

### Positive

- High maintainability and unified single-codebase continuous delivery for all customers.
- Enterprise security posture with zero arbitrary code execution vectors.
- Complete feature portability and predictable testing across environments.

### Negative

- Emerging requirements must be formalized into generic, configurable platform capabilities rather than quick hardcoded patches.
