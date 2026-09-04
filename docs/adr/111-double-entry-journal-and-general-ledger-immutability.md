# ADR 111: Double-Entry Journal and General Ledger Immutability

## Status
Accepted

## Context
A fundamental invariant of enterprise accounting is that every posted transaction must balance (SUM(Debits) = SUM(Credits)), and historical accounting records must never be modified or deleted in-place.

## Decision
Adopt a dual-structure model: `JournalEntry` (header + lines) represents the business transaction document, while `GeneralLedgerEntry` represents the canonical, posted financial impact. Once a JournalEntry reaches `POSTED` status, both the journal and its ledger rows become strictly immutable. No API or database operation may update or delete posted lines. All corrections must occur via explicit reversal journals or adjustment entries.

## Consequences
Guarantees complete financial auditability and compliance with GAAP/IFRS standards. Prevents retroactive tampering with historical financial statements.
