# ADR-106: Bounded Receiving Inspection and Rejection Handling

## Status
Accepted

## Context
Delivered goods may arrive damaged or fail quality verification. Rejected goods must not enter available inventory balances.

## Decision
1. GRN lines capture `deliveredQty`, `acceptedQty`, `rejectedQty`, and `damagedQty`.
2. Only `acceptedQty` is posted to inventory stock.
3. Rejected goods are assigned a disposition (`RETURN_TO_VENDOR`, `REPLACEMENT_EXPECTED`, `SCRAP`) without modifying available stock balances.

## Consequences
- Prevents defective stock from being allocated to maintenance work orders and feeds quality metrics into vendor performance scorecards.