# ADR 125: Liability Resolution Engine (Owner vs Tenant vs Split Occupancy)

## Context
Society bylaws and lease agreements differ: some societies hold owners strictly liable for all charges, while others bill tenants directly for utilities and amenities while billing owners for capital reserves (Sinking Fund). Furthermore, vacant units often receive reduced maintenance charges.

## Decision
We implement a centralized, policy-driven `LiabilityResolverService`. Given a unit and billing period, the engine consults community billing policies, active tenancies, ownership records, and unit occupancy status to resolve:
1. Target `BillableAccount` (Owner, Tenant, or Split).
2. Applicable `BillingPlan` (Standard Residential, Tenant Plan, Vacant Unit Plan).
3. Exclusions or special concessions.

## Consequences
- Billing run batch processors never contain hardcoded occupancy logic.
- Community-specific liability rules are configured, not custom-coded.