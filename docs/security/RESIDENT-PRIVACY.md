# Resident PII Privacy & Least Privilege

## 1. Threat Model & Privacy Controls

Residential platforms store high-risk personally identifiable information (PII), including phone numbers, personal email addresses, family relationships, and dates of birth.

Community OS implements least-privilege serialization for resident data:

1. **Public / Directory DTO (`ResidentSummaryDto`)**:
   - Fields: `id`, `communityId`, `displayName`, `firstName`, `lastName`, `status`, `hasUserLinked`.
   - Contact fields (`phone`, `email`, `dateOfBirth`) are excluded entirely.
2. **Confidential Contact Serialization (`ResidentDetailDto`)**:
   - `phone` and `email` are only returned in plaintext if the caller possesses `PERMISSIONS.RESIDENT_CONTACT_VIEW` or is accessing their OWN profile.
   - For other callers, phone is masked (`+12****0100`) and email is masked (`jo***@***.com`).
3. **Database Index Protection**:
   - Indexes on `phone` and `email` are scoped by `communityId` (`@@index([communityId, email])`) to ensure multi-tenant query isolation.
