# ADR 087: Multi-Store Hierarchy, Storage Locations & Bin Organization

## Status

**ACCEPTED**

## Context

Communities maintain diverse storage facilities including central warehouses, clubhouse sub-stores, maintenance cages, and floor-level utility closets.

## Decision

Implement InventoryStore scoped to Organization and optionally Community, with typed classifications (CENTRAL, COMMUNITY, BUILDING, MAINTENANCE, SECURITY, HOUSEKEEPING, TEMPORARY). Support bounded StockBin locations (rack, shelf, bin) within stores. Authoritative access is resolved via central InventoryStoreAccessResolver integrated with the IAM system.

## Consequences

Precise location tracking of spare parts across large physical campuses without over-engineering complex wave-picking WMS logistics.
