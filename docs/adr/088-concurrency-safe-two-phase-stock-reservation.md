# ADR 088: Concurrency-Safe Two-Phase Stock Reservation Architecture

## Status

**ACCEPTED**

## Context

When multiple work orders or maintenance teams require the same limited spare parts simultaneously, race conditions can cause double-allocation or stock exhaustion.

## Decision

Implement a two-phase reservation model: (1) Work order material requirements create StockReservation records that increase quantityReserved and decrease quantityAvailable (quantityOnHand remains unchanged); (2) Storekeeper dispatch converts reservation to posted InventoryIssue, decreasing both quantityOnHand and quantityReserved. Use row-level locking on StockBalance to ensure available quantity never drops below zero.

## Consequences

Guaranteed material availability for scheduled high-priority maintenance jobs, no phantom stockouts, safe concurrent allocations.
