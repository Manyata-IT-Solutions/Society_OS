# ADR 137: Migration Engine for Opening Receivables & Historical Balances

## Context
When migrating an existing society to Community OS, legacy outstanding dues and advance credits must be imported accurately with audit integrity.

## Decision
We implement `BillingMigrationService` supporting CSV import with a 4-stage pipeline: Upload -> Validation -> Preview -> Execution. The engine creates initial `BillableAccount` and `ResidentAccount` records, posts `OPENING` entries in `ResidentLedgerEntry`, initializes `ResidentOutstanding`, and links to the Phase 13 Opening Balances journal.

## Consequences
- Safe, validated onboarding of legacy dues without data corruption.
- Complete reconciliation between migrated resident balances and General Ledger opening balances.