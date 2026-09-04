# ADR 117: Journal Reversal and Correction Lineage

## Status
Accepted

## Context
Errors in posted journals must be corrected without destroying the historical record of what was originally posted.

## Decision
Implement reversal by generating a new `JournalEntry` of type `REVERSAL` containing inverted debit/credit lines. The original journal is marked `REVERSED` with a bidirectional link `reversalJournalId`. Double reversals are rejected idempotently. Reversals respect fiscal period rules and may post into the current open period if the original period is closed.

## Consequences
Maintains pristine accounting history, clear audit trails, and zero risk of orphaned ledger entries.
