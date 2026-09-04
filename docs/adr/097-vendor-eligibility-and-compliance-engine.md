# ADR-097: Vendor Eligibility and Compliance Engine

## Status
Accepted

## Context
Procurement teams must ensure that invited vendors are legally compliant (valid GSTIN/PAN, non-expired insurance/licenses) and not suspended or blacklisted.

## Decision
1. Introduce a central `VendorEligibilityService` to evaluate:
   - Onboarding state (`APPROVED`)
   - Operational status (non-suspended, non-blacklisted)
   - Mandatory document validity (no expired statutory certificates)
   - Community eligibility link
   - Category / capability match
2. Controllers and business services must query `VendorEligibilityService` rather than embedding inline checks.

## Consequences
- Guarantees compliance enforcement across RFQ invitations, quotation recordings, and PO issuances.