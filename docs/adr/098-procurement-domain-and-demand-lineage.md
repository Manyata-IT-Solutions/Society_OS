# ADR-098: Procurement Domain and Demand Lineage

## Status
Accepted

## Context
Enterprise procurement must answer: *"Why was this purchased, for which work order, and against which approval?"*

## Decision
1. Maintain end-to-end demand lineage across:
   `WorkOrderMaterialRequirement` / `ReorderSuggestion` -> `PurchaseRequisitionLine` -> `RfqLine` -> `QuotationLine` -> `PurchaseOrderLine` -> `GrnLine`.
2. Procurement controls commercial commitments; Inventory controls physical stock; Finance controls payments and general ledger.

## Consequences
- Complete traceability from technician work order demand to warehouse receipt without mixing domain boundaries.