# ADR-0029: Immutable Double-Entry Financial Posting & Reversal Policy

## Status
Accepted

## Context
Financial records in community accounting require auditability and anti-tampering guarantees.

## Decision
1. Posted general ledger journal entries (`status = 'POSTED'`) are completely immutable and cannot be updated or deleted through any application API.
2. Error correction must occur via offsetting reversal journal entries in the active fiscal period.
3. All journals must satisfy double-entry balance constraints (total debit = total credit).

## Consequences
Ensures financial integrity, audit traceability, and regulatory compliance.
