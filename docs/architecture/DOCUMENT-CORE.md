# Document Core Architecture

## 1. Executive Summary

The Community OS **Document Core** provides enterprise-grade document management with immutable versioning, secure pluggable object storage, polymorphic resource linking, classification-based access controls, and anti-tamper checksum integrity verification.

---

## 2. Core Architectural Principles

1. **Object Storage Abstraction**:
   - File binaries are NEVER stored as database `BYTEA`/blobs in PostgreSQL.
   - Files are stored in object storage via the `ObjectStorageProvider` interface (`LocalDiskStorageProvider` for development, S3/GCS/Azure Blob for cloud deployments).
   - Database stores only metadata, version trees, storage keys, and cryptographic checksums.
2. **Immutable Document Versions**:
   - Updates to a document's contents always create a new incremental `DocumentVersion` row (`v1`, `v2`, `v3`).
   - Prior versions remain unchanged and accessible in the version history.
   - `Document.currentVersionId` points to the active version.
3. **Generic Polymorphic Resource Linking**:
   - Documents are attached to domain resources using `DocumentLink` rows (`resourceType: 'unit' | 'building' | 'resident' | 'organization'`, `resourceId`, `relationshipType: 'ATTACHMENT' | 'AGREEMENT' | 'INVOICE' | 'IDENTIFICATION'`).
   - Strict tenant boundary checks prevent linking documents across disparate organizations.
4. **Classification & Access Controls**:
   - `PUBLIC`: Accessible to all authenticated tenant members.
   - `INTERNAL`: Accessible to tenant staff and managers.
   - `CONFIDENTIAL`: Accessible only to authorized managers and explicit owners.
   - `RESTRICTED`: Requires explicit `document.manage_restricted` permissions.
5. **Integrity & Malware Scanning Pipeline**:
   - Every file version computes a SHA-256 checksum during ingest.
   - Versions flagged as `QUARANTINED` are blocked from download streams.

---

## 3. Storage Hierarchy Layout

Storage keys follow a predictable, tenant-isolated path structure:

```
{organizationId}/{communityId}/documents/{documentId}/v{versionNumber}/{fileName}
```

Example:

```
169fc183-f884-4c9d-9375-839973637fc0/06b4a306-af34-466e-85c0-bce5197322f9/documents/3edfcd32-1458-41b0-a16e-e5a2ab7bd798/v1/bylaws_2026.pdf
```
