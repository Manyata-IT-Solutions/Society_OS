# ADR 135: Late Fee & Interest Calculation Engine

## Context
Societies charge late fees (fixed or percentage) or simple/compounding interest on overdue invoices past the grace period.

## Decision
We implement an idempotent `PenaltyInterestService`. Given an overdue invoice past its `graceDate`, the engine computes late fees according to configured `LateFeePolicy` or `InterestPolicy`. Penalties are recorded as discrete adjustment entries linked to the invoice rather than mutating original line items. Repeated execution on the same date is strictly idempotent.

## Consequences
- Transparent penalty tracking on invoices.
- Zero risk of duplicate penalty compounding upon scheduled sweep retries.