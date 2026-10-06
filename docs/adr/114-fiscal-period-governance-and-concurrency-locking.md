# ADR 114: Fiscal Period Governance and Concurrency Locking

## Status
Accepted

## Context
Posting transactions into closed fiscal periods compromises financial close integrity and statutory tax reporting.

## Decision
Support three period states: `OPEN` (normal posting), `SOFT_CLOSED` (restricted to privileged adjustment entries), and `HARD_CLOSED` (strictly zero posting allowed). Closing a period requires maker-checker approval and automated checklist verification. To prevent race conditions where a user posts into a period while an admin is closing it, period validation acquires row-level locks or transaction-isolated status checks during posting.

## Consequences
Prevents backdated entries into finalized fiscal periods while supporting controlled audit adjustments.
