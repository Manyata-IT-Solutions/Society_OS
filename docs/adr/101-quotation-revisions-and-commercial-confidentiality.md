# ADR-101: Quotation Revisions and Commercial Confidentiality

## Status
Accepted

## Context
Vendors may submit revised quotes during negotiations or before deadlines. Competitor pricing must remain strictly confidential.

## Decision
1. Support quotation revisions (`revision` integer, `isCurrentRevision` flag) without overwriting historical bids.
2. Vendor A must never view Vendor B's quotation. Requesters cannot access quotation values until the evaluation stage.
3. Sealed bid mode prevents premature disclosure of commercial figures before deadline expiration.

## Consequences
- Complete audit trail of price negotiations while safeguarding commercial confidentiality.