# ADR-108: Deterministic Vendor Performance Scorecard and Risk

## Status
Accepted

## Context
Vendor ratings must be grounded in objective operational metrics rather than subjective 1-5 star opinions alone.

## Decision
1. Compute periodic vendor scorecards based on:
   - **On-Time Delivery Rate**: Accepted deliveries on or before PO committed delivery date.
   - **Quality Acceptance Rate**: Accepted quantity / Total delivered quantity.
   - **Fulfillment Rate**: Accepted quantity / Total ordered quantity on closed POs.
   - **Quotation Response Rate**: Responded RFQs / Total invited RFQs.
2. Combine objective metrics with auditable qualitative category ratings.

## Consequences
- Provides reproducible, defensible vendor scorecards and risk ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).