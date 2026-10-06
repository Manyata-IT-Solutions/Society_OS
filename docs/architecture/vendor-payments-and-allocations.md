# Vendor Payments and Allocations

## Payment Execution & Invariants
- Disbursements decrease bank book balances and discharge AP liability.
- FIFO or specific allocation against outstanding supplier invoices.
- **Controlled Reversal**: Successful payments are never deleted. Reversal restores invoice outstanding balances, appends reversal entries to Vendor Subledger, and posts reversing GL journals.
