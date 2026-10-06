# ADR 113: Account Balance Projection and Rebuild Reconciliation

## Status
Accepted

## Context
Querying Trial Balance, Balance Sheets, and Dashboards by summing millions of GeneralLedgerEntry rows on every request would degrade performance at scale. However, pre-aggregated balances risk diverging if not properly governed.

## Decision
Maintain an `AccountBalance` projection table indexed by `(accountingEntityId, accountId, fiscalYearId, periodId, fundId, costCenterId)`. The projection is updated atomically during journal posting. Crucially, the General Ledger remains the single source of truth. An internal `FinancialIntegrityService` provides automated audit sweeps and a controlled projection rebuild capability that recalculates AccountBalance purely from immutable ledger rows without touching the ledger.

## Consequences
Sub-millisecond trial balance and dashboard queries with guaranteed self-healing reconciliation capabilities.
