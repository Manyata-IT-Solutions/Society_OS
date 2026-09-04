# ADR 089: Material Flow Lifecycle: Requirement -> Issue -> Consumption -> Return

## Status

**ACCEPTED**

## Context

Conflating the act of handing material to a technician with the actual consumption of that material in a work order results in untracked shrinkage and prevents returning unused items.

## Decision

Model explicit decoupled operational states: (1) MaterialRequirement expresses planned need; (2) InventoryIssue records physical dispatch from store to technician (decreasing store stock); (3) WorkOrderMaterialConsumption records actual utilization on equipment; (4) InventoryReturn records physical return of unused/defective material back to store (increasing store stock). Consumed quantity + returned quantity cannot exceed issued quantity.

## Consequences

Precise field accounting, zero unrecorded shrinkage, accurate spare parts costing per equipment, clean technician workflow.
