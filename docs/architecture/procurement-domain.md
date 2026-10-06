# Enterprise Procurement Domain Architecture

## Overview
The Procurement subsystem orchestrates the complete Procure-to-Receive (P2R) operational lifecycle, connecting maintenance demand to warehouse stock receipt.

## Lifecycle
1. **Demand & Requisitions**: Generated from inventory reorder points, work order shortages, or manual demand.
2. **RFQs & Invitations**: Competitive bidding with deadline enforcement and vendor eligibility verification.
3. **Quotations & Comparison**: Normalized landed cost comparison, weighted scoring, and technical compliance review.
4. **Sourcing Awards**: Sourcing recommendations with split award support and Approval Engine sign-off.
5. **Purchase Orders**: Formal commercial commitments with issued immutability and versioned amendments.
6. **Receiving & Inspection**: Goods Receipt Notes (GRN) with inspection, over-receipt atomic guards, and idempotent posting to Phase 11 Inventory.
7. **Service Procurement**: Service Receipt Notes for non-inventory works.
