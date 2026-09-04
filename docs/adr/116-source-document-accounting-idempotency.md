# ADR 116: Source Document Accounting Idempotency

## Status
Accepted

## Context
When external modules (e.g. Billing, Procurement, Payments) trigger accounting postings via events or API calls, retries could create duplicate journal entries and double-count revenue or expenses.

## Decision
Enforce a unique database constraint on `(sourceModule, sourceType, sourceId, postingPurpose)` on `JournalEntry`. Retrying the same source event returns the existing posted journal safely without re-posting.

## Consequences
Guarantees end-to-end exactly-once financial posting semantics across distributed workers and background queues.
