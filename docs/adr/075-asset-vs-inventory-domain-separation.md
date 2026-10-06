# ADR 075: Asset vs Inventory Strict Domain Separation

## Status

Accepted

## Context

In Community OS, physical equipment management must clearly distinguish between capital/durable physical assets (e.g., 500kVA Diesel Generator, Central Chiller, Passenger Elevator) and consumable spare parts/inventory (e.g., oil filters, light bulbs, copper pipes).
Conflating assets and inventory into a single table causes data modeling pollution, inaccurate lifecycle state machines, and invalid depreciation/maintenance histories.

## Decision

We establish a strict separation between the Asset Domain (Phase 10) and the Inventory/Stock Domain (future phase):

1. **Durable Physical Item**: An `Asset` is a uniquely identified, serialized physical piece of equipment that requires ongoing maintenance, has warranties/AMCs, tracks operating hours/meters, and undergoes a discrete lifecycle (Commissioning -> Active -> Decommissioning).
2. **Consumables Not Modeled as Assets**: Consumables and stock parts are explicitly deferred to a dedicated inventory module and are never represented as rows in the `assets` table.
3. **Decoupled Work Order Links**: Work orders reference assets through `WorkOrderAssetLink` to record service history without requiring inventory tracking.

## Consequences

- Preserves clean asset lifecycle semantics without stock-level complexity.
- Allows rigorous tracking of equipment warranties, contracts, and downtime.
- Enables clean future integration with dedicated procurement and inventory engines.
