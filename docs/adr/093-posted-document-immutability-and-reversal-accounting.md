# ADR 093: Posted Document Immutability & Compensating Reversal Accounting

## Status

**ACCEPTED**

## Context

Allowing edits to already-posted receipts, issues, or adjustments corrupts the stock ledger history and breaks audit integrity.

## Decision

Enforce strict posted document immutability: Once a receipt, issue, transfer, or adjustment is in POSTED state, its lines, quantities, and items are immutable. Correcting errors requires executing an explicit Reversal command with mandatory reason codes, which generates inverse compensating ledger entries and links back to the original document.

## Consequences

Enterprise-grade audit readiness, complete non-repudiation, protection against fraudulent inventory alterations.
