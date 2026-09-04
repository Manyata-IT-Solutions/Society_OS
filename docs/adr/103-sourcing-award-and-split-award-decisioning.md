# ADR-103: Sourcing Award and Split Award Decisioning

## Status
Accepted

## Context
Enterprise procurement often awards line items to different vendors (split award) or awards quantities across multiple suppliers to mitigate delivery risk.

## Decision
1. Capture award decisions explicitly in `SourcingAward` and `SourcingAwardLine` records.
2. Split awards link specific RFQ lines to different quotations and generate distinct Purchase Orders.
3. Awards require Approval Engine sign-off before Purchase Orders can be generated.

## Consequences
- Clear separation between evaluation recommendation, approval decision, and PO generation.