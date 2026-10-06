# ADR-100: RFQ Lifecycle and Vendor Invitation Boundary

## Status
Accepted

## Context
Requests for Quotation (RFQs) solicit competitive commercial proposals from vetted vendors based on approved purchase requisitions.

## Decision
1. RFQ follows strict lifecycle states: `DRAFT` -> `PUBLISHED` -> `OPEN` -> `CLOSED` -> `EVALUATION` -> `AWARDED` -> `CANCELLED`.
2. Vendors receive invitations (`RfqVendorInvitation`) and submit quotations before the server-enforced deadline.
3. Deadline extensions require audited justification and trigger notifications to all invited vendors.

## Consequences
- Ensures fairness and audit compliance in competitive sourcing.