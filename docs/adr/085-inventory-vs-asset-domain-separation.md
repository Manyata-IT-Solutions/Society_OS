# ADR 085: Inventory Item vs Physical Asset Domain Separation & Operational Conversion

## Status

**ACCEPTED**

## Context

In Community OS, physical equipment management (Phase 10) and inventory/stores management (Phase 11) serve distinct operational and accounting purposes. Treating every consumable or spare as an Asset causes cardinality explosion and lifecycle mismatch, while treating complex equipment as simple inventory misses maintenance plans, warranties, telemetry, and spatial movement history.

## Decision

Maintain a strict architectural separation: (1) InventoryItem models stock-managed materials, consumables, spare parts, and supplies tracked by count/weight/volume across stores/bins; (2) Asset models individually tracked, durable equipment with operational lifecycles, run-hour telemetry, and service contracts; (3) Serialized inventory items support an explicit operational ConvertToAsset command upon installation that archives the inventory serial and creates an Asset record.

## Consequences

Clean separation of concerns, no inventory table bloat for equipment history, explicit lifecycle transitions when spare parts become capital equipment, zero financial ambiguity.
