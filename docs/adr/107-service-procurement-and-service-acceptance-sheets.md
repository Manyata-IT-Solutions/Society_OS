# ADR-107: Service Procurement and Service Acceptance Sheets

## Status
Accepted

## Context
Procurement of services (e.g. lift AMC, transformer oil filtration, security guarding) does not result in physical warehouse stock.

## Decision
1. Service Purchase Orders generate `ServiceReceiptNote` (Service Entry Sheets) capturing service milestones, delivery dates, and supervisor verification.
2. Service acceptance updates PO delivery progress without calling the Inventory stock ledger.

## Consequences
- Uniform procurement lifecycle for both physical materials and facility services.