# Platform Security Architectures (Phase 5)

## 1. Audit Security (`AUDIT-SECURITY.md`)

- **Immutability Protection**: The database schema and NestJS API do not expose update or delete operations on `AuditRecord`.
- **Sensitive Data Masking**: Fields matching `password`, `token`, `secret`, `otp`, `apiKey`, `auth` are recursively replaced with `[REDACTED]` before saving.
- **CSV Formula Injection Mitigation**: Any field beginning with `=`, `+`, `-`, or `@` is prefixed with `'` to prevent Excel/Calc formula execution exploits.

## 2. Notification Security (`NOTIFICATION-SECURITY.md`)

- **Recipient IDOR Protection**: Users can only query and mark notifications addressed to their verified `userId` (`/notifications/inbox`).
- **Template Parameter Injection Prevention**: Interpolation only evaluates declared dictionary keys. Arbitrary JavaScript or template expression execution is strictly prohibited.
- **Rate Limiting & Deduplication**: Outgoing notifications require idempotency checks via `deduplicationKey` to avoid duplicate billing notices or spam.

## 3. Document Security (`DOCUMENT-SECURITY.md`)

- **Direct Object Reference (IDOR) Mitigation**: Documents are bound to `organizationId` and optional `communityId`. Actors cannot view or download documents outside their permitted tenant boundary.
- **Classification Clearance**: Access to `CONFIDENTIAL` or `RESTRICTED` documents requires elevated role permissions (`document.manage_restricted`).
- **Path Traversal Protection**: Storage keys are sanitized and checked against parent root directory escapes.
- **Quarantine Enforcement**: Versions infected with malware or flagged during virus scans are marked `QUARANTINED` and immediately rejected from download endpoints.
