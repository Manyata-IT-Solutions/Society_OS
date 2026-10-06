# ADR 081: Warranty and AMC Service Contract Coverage

## Status

Accepted

## Context

Physical equipment relies on OEM warranties and multi-year Annual Maintenance Contracts (AMC/CMC) with third-party service providers.
Managing service contracts requires tracking contract terms, SLA response/resolution hours, scheduled visit quotas, and multi-asset coverage links.

## Decision

1. **Distinct Warranty & Contract Models**:
   - `AssetWarranty`: Tracks OEM/vendor warranty terms attached to specific assets.
   - `AssetServiceContract`: Represents master service agreements (AMC, CMC, On-Call) covering one or multiple assets via `AssetServiceContractLink`.
2. **SLA Guarantees**: Contracts store contractual SLA response and resolution timeframes in hours for automated breach tracking during breakdowns.
3. **Contract Expiration Engine**: Background sweeper evaluates expiring contracts (within 30/60 days) and emits domain events for vendor renewal alerts.

## Consequences

- Direct visibility of warranty status during work order dispatch prevents unnecessary billing.
- Contract-level SLA enforcement for external vendor performance.
