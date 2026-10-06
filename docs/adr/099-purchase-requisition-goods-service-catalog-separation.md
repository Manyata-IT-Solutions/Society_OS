# ADR-099: Purchase Requisition Goods and Service Catalog Separation

## Status
Accepted

## Context
Procurement demands encompass catalog inventory items, non-catalog specialized parts, and pure services (e.g. lift annual servicing, water tank cleaning).

## Decision
1. Support distinct line types: `CATALOG_ITEM` (linked to `InventoryItem`), `NON_CATALOG_ITEM` (free-text with full specification), and `SERVICE` (service category).
2. Service requisitions do not create artificial inventory item records.

## Consequences
- Prevents database catalog pollution while maintaining rich technical specifications for one-time civil or specialized works.