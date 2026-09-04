# ADR 086: Immutable Stock Ledger & Transactional Balance Projections

## Status

**ACCEPTED**

## Context

Directly updating a single quantityOnHand column in a database makes auditability impossible, introduces lost-update race conditions, and prevents historical point-in-time inventory reconstruction.

## Decision

Enforce a ledger-first architecture: All quantity changes occur exclusively through immutable StockLedgerEntry records with signed quantityDelta values, reference types, and idempotency keys. StockBalance is maintained transactionally as an ACID-synchronized read projection with row-level locks (SELECT FOR UPDATE) on (storeId, binId, itemId, batchId). Direct balance modification via PATCH APIs is strictly prohibited.

## Consequences

Guaranteed mathematical auditability, reconstructible historical stock levels, zero race conditions, and complete traceability.
