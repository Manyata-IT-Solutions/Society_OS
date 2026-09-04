# ADR 132: Append-Only Resident Subledger vs Phase 13 General Ledger Synchronization

## Context
Accounts Receivable requires a detailed resident-level subledger (`ResidentLedgerEntry`) as well as high-level General Ledger control accounts (`AR_CONTROL`, `MAINTENANCE_INCOME`, `SINKING_FUND_LIABILITY`). Direct modification of GL entries from billing code violates separation of concerns.

## Decision
The billing module maintains an append-only `ResidentLedgerEntry` subledger for granular resident transaction history. For every financial event (Invoice Issue, Payment Receipt, Reversal, Waiver), the module invokes the Phase 13 `FinancialPostingService` using unique source idempotency keys.

## Consequences
- Billing code never mutates General Ledger tables directly.
- The subledger sum exactly equals the `AR_CONTROL` balance in the General Ledger.