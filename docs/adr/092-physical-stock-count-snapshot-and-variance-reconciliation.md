# ADR 092: Physical Stock Count, System Snapshot & Controlled Variance Reconciliation

## Status

**ACCEPTED**

## Context

Periodic stocktaking is mandatory for inventory integrity. Direct overwrite of stock balances during counting corrupts audit trails and obscures shrinkage patterns.

## Decision

Implement a structured stocktaking lifecycle (DRAFT -> IN_PROGRESS -> SUBMITTED -> REVIEWED -> POSTED): (1) Count initialization captures an immutable systemSnapshotQty; (2) Physical counts record countedQty and compute varianceQty; (3) Posting the count does NOT overwrite balances directly, but posts compensating COUNT_RECONCILIATION stock ledger entries with audit records and optional maker-checker approval.

## Consequences

Uncompromised ledger continuity, transparent variance reporting, seamless maker-checker approval for large shrinkage discrepancies.
