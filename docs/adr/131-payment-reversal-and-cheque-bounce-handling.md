# ADR 131: Payment Reversal, Cheque Bounce Handling & Ledger Rollback

## Context
Cheques may bounce due to insufficient funds, or online payments may be charged back. Deleting payments destroys audit logs and leaves invoices marked as paid.

## Decision
We implement a transactional `PaymentReversalService`. When a cheque bounces or payment is reversed:
1. `Payment` status is set to `REVERSED` with reason and actor.
2. Associated `PaymentAllocation` rows are rolled back, restoring invoice `outstandingAmount` and overdue status.
3. An append-only `PAYMENT_REVERSAL` entry is posted to the `ResidentLedgerEntry`.
4. A reversal journal request is sent to the Phase 13 Posting Engine (Dr AR Control, Cr Bank).

## Consequences
- Reversible operations preserve historical evidence without destructive deletions.
- Accounts receivable balances and general ledger remain in exact synchronization.