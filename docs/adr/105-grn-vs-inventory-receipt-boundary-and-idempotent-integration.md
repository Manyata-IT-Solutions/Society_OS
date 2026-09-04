# ADR-105: GRN vs Inventory Receipt Boundary and Idempotent Integration

## Status
Accepted

## Context
A Goods Receipt Note (GRN) records the logistical delivery and inspection of ordered goods. An Inventory Receipt posts physical stock movements into the warehouse ledger.

## Decision
1. Keep `GoodsReceiptNote` and `InventoryReceipt` as separate domain entities.
2. When a GRN is `POSTED`, it idempotently calls Phase 11 `InventoryReceiptService.createReceipt` with the accepted quantities, batch data, and serial numbers.
3. Retry attempts use idempotent receipt reference keys to prevent duplicate ledger postings.

## Consequences
- Preserves clean decoupling between Procurement receiving and Inventory stock management.