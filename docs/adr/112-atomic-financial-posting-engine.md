# ADR 112: Atomic Financial Posting Engine

## Status
Accepted

## Context
Posting a journal entry affects multiple database tables: JournalEntry status, GeneralLedgerEntry rows, AccountBalance projections, and outbox audit events. A partial post caused by application crash or network timeout would corrupt the General Ledger.

## Decision
All financial posting operations are centralized in a single `FinancialPostingService`. Posting is executed within a single PostgreSQL serializable/read-committed transaction. The engine validates: (1) AccountingEntity is ACTIVE, (2) Fiscal period allows posting (OPEN), (3) SUM(DR) == SUM(CR), (4) All accounts are active and postingAllowed, (5) Control accounts are not manually violated, (6) Idempotency keys are enforced. If any check fails, the transaction is rolled back completely.

## Consequences
Ensures zero partial postings. All financial impacts commit atomically alongside domain events and audit logs.
