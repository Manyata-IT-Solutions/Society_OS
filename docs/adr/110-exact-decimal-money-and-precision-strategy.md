# ADR 110: Exact Decimal Money and Arithmetic Precision Strategy

## Status
Accepted

## Context
JavaScript IEEE 754 floating-point numbers exhibit binary precision artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004) that are unacceptable in authoritative general ledger accounting.

## Decision
All monetary values in the database are stored as PostgreSQL `NUMERIC(18, 4)` / `DECIMAL(18, 4)`. In application services and posting validation, all amounts are handled using deterministic string-based or Decimal arithmetic. Explicit minor-unit rounding (e.g. 2 decimal places for INR, USD) is applied according to configured rules before double-entry balance validation.

## Consequences
Eliminates floating-point discrepancies. Guarantees mathematical determinism across all accounting calculations, trial balance balancing, and ledger reporting.
