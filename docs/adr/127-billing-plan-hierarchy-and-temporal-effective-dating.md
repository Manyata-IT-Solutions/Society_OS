# ADR 127: Billing Plan Hierarchy and Temporal Effective Dating

## Context
Societies frequently revise maintenance tariffs (e.g. ₹2.50/sqft until March 31, ₹2.80/sqft from April 1). Updating rates must never rewrite or recalculate historical invoices.

## Decision
All `BillingPlan`, `ChargeRule`, and `ChargeAssignment` records support temporal effective dating with `effectiveFrom` and `effectiveTo` timestamps. When a billing run generates invoices for a period, rules are resolved based on the period's date window. Old rules remain immutable.

## Consequences
- Historical accounting truth is guaranteed.
- Future rate revisions can be pre-configured without affecting current billing cycles.