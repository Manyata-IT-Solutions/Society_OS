# Match Exception Resolution

## Exception Types
- `PRICE_VARIANCE`: Invoice unit price exceeds PO unit price beyond tolerance policy.
- `QTY_VARIANCE` / `OVER_INVOICE`: Invoiced quantity exceeds accepted receipt quantity.
- `MISSING_GRN`: Goods invoiced with no corresponding posted GRN.
- `MISSING_SERVICE_ACCEPTANCE`: Service invoiced with no approved service receipt.
- `VENDOR_MISMATCH`, `CURRENCY_MISMATCH`.

## Resolution Actions
- Accept with price adjustment debit note.
- Supplier credit memo request.
- Managerial override with audit reason log.
