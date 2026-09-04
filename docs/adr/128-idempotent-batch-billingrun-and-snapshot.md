# ADR 128: Idempotent Batch BillingRun & Immutable Billing Snapshot

## Context
Generating invoices for 600 to 10,000+ units requires atomic, fault-tolerant batch processing. Network timeouts or server restarts must not generate duplicate invoices or leave partial runs in undefined states.

## Decision
We implement `BillingRun` with unique composite idempotency keys `(communityId, billingPeriodId, billingPlanId, runPurpose)`. Each run produces an immutable `BillingSnapshot` capturing:
- Applicable rates and rules
- Property super built-up areas
- Parking allocations
- Resolved occupancy and liable accounts
- Proration factors

Retries inspect existing successful invoices and resume only pending/failed units.

## Consequences
- Exactly one invoice is generated per eligible account per billing period.
- Audit trails possess complete snapshot evidence of calculation inputs.