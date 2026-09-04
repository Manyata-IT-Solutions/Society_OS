# ADR-028: Privacy-Aware Resident Contact Serialization

## Status

Accepted

## Context

Community directories should allow staff and neighbors to see resident names and unit allocations without exposing private phone numbers, personal email addresses, or birth dates to unauthorized actors.

## Decision

We enforce role-based masking at the serialization layer:

1. `ResidentSummaryDto`: Omits phone, email, and DOB entirely.
2. `ResidentDetailDto`: Contains plain contact info only if the caller holds `PERMISSIONS.RESIDENT_CONTACT_VIEW` or is accessing their OWN profile. Otherwise, phone numbers and emails are masked.

## Consequences

- **Positive**: Compliant with global privacy regulations (GDPR, CCPA, Digital Personal Data Protection Act).
- **Positive**: Eliminates accidental leaks of personal contact information across the API surface.
- **Trade-off**: Requires serialization helper functions to be called consistently across all controller routes.
