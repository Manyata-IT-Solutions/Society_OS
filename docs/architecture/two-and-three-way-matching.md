# Two and Three-Way Matching Engine

## Matching Principles
- **2-Way Match (Services / Blanket POs)**: Validates Supplier Invoice against Purchase Order price and authorization limits.
- **3-Way Match (Goods)**: Validates Supplier Invoice against PO price and accepted quantities from posted Goods Receipt Notes (GRN).
- **Service Acceptance Match**: Validates against accepted Service Receipt Notes.
- Cumulative billed quantity across multiple partial invoices cannot exceed accepted receiving quantities.
