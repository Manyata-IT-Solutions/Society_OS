# Bill of Quantities (BOQ) & Quantity Architecture

## Structure
- `BillOfQuantities`: Header containing version, revision number, approved status, subtotal, tax estimate, and contingency.
- `BoqLine`: Detailed line item tracking section code, item code, description, quantity, unit rate, estimated amount, awarded quantity, measured quantity, certified quantity, and billed quantity.

## Revisions
When an approved BOQ requires modification:
1. Current revision is marked `SUPERSEDED` (`isCurrentRevision: false`).
2. New revision header is created with incremented revision number and reason for change.
