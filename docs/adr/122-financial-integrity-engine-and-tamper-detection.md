# ADR 122: Financial Integrity Engine and Tamper Detection

## Status
Accepted

## Context
Financial systems must provide autonomous self-auditing to detect and alert on any mathematical imbalance, orphaned ledger row, or projection drift.

## Decision
Build a dedicated `FinancialIntegrityService` that executes 8 deterministic integrity sweeps: (1) Trial balance debits equal credits, (2) Every posted journal balances, (3) All ledger entries link to valid journals, (4) Journal totals match line sums, (5) AccountBalance matches ledger sum, (6) No entries in hard-closed periods, (7) Zero cross-entity account usage, (8) Zero duplicate source postings. Mismatches generate alerts and domain events.

## Consequences
Continuous automated financial auditing and verifiable ledger integrity.
