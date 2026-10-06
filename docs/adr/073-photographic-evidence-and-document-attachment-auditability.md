# ADR 073: Photographic Evidence and Document Attachment Auditability

## Status

Accepted

## Context

Facility maintenance disputes often arise over whether physical work was properly completed (e.g. whether a water tank was cleaned or an air filter replaced). Visual proof (before/after photos) is essential for supervisor approval and customer accountability.

## Decision

1. `WorkOrderEvidence` links documents to work orders with structured `WorkEvidenceType` enum:
   - `BEFORE_PHOTO`
   - `AFTER_PHOTO`
   - `COMPLETION_PROOF`
   - `ISSUE_DOCUMENTATION`
   - `WORK_ORDER_ATTACHMENT`
2. Photos link to Phase 5 `DocumentCore` storage with cryptographic hash and immutable metadata.
3. Checklist items with `failureRequiresPhoto = true` enforce photo attachment upon failure.

## Consequences

- Clear evidentiary record for every completed work order.
- Prevents falsified completion reports.
