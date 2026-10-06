# ADR-104: Purchase Order Immutability and Amendment Versioning

## Status
Accepted

## Context
An issued Purchase Order represents a legally binding commercial commitment. Direct updates to price, quantity, or terms after issuance would invalidate audit trails and receiving context.

## Decision
1. Issued Purchase Orders are immutable.
2. Any modification requires an explicit **Amendment** (`PurchaseOrderRevision`) with revision increment, change justification, full snapshot preservation, and re-approval.
3. Goods Receipt Notes pin to the exact PO revision active at the time of delivery.

## Consequences
- Complete historical integrity for legal, financial, and inventory audit compliance.