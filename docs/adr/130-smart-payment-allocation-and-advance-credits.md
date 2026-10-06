# ADR 130: Smart Payment Allocation Strategies & Partial/Advance Credit Accounting

## Context
Residents do not always pay exact single invoice amounts. They make partial payments, lump-sum multi-quarter payments, or advance deposits before billing runs.

## Decision
We implement a decoupled `PaymentAllocationService`. Payments record the gross money received (`Payment` entity) and are allocated to outstanding invoices via `PaymentAllocation` rows using configurable strategies:
- `OLDEST_DUE_FIRST` (Default statutory FIFO)
- `CURRENT_INVOICE_FIRST`
- `SPECIFIC_INVOICE`
- `MANUAL`

Any unallocated amount is preserved as `advanceCredit` on the resident's `ResidentAccount` and can be applied automatically to subsequent invoices.

## Consequences
- Seamless handling of partial payments, multi-invoice settlements, and overpayments without balance loss.
- Invoices transition to `PARTIALLY_PAID` or `PAID` strictly based on authorized allocations.