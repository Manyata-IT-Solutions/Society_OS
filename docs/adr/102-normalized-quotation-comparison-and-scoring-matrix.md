# ADR-102: Normalized Quotation Comparison and Scoring Matrix

## Status
Accepted

## Context
Comparing quotations requires normalizing base unit prices, volume discounts, taxes, freight charges, warranty terms, and technical compliance.

## Decision
1. Build a deterministic `QuotationComparisonService` computing:
   - Landed comparable cost per line and total.
   - Weighted scoring matrix across Commercial Price, Technical Compliance, Delivery Lead Time, and Vendor Rating.
2. The system highlights the lowest commercial bid but permits non-lowest recommendations when accompanied by documented technical justifications.

## Consequences
- Transparent, explainable, and multi-dimensional vendor evaluation.