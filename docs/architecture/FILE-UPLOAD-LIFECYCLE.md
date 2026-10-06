# File Upload & Ingestion Lifecycle

## 1. Upload Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / Admin
    participant API as DocumentsController
    participant Auth as DocumentAuthorizationService
    participant DocSvc as DocumentService
    participant Storage as ObjectStorageProvider
    participant DB as Prisma / Database
    participant Bus as EventBus

    User->>API: POST /documents (Metadata + Version Payload)
    API->>Auth: enforce(actor, 'document.create', scope)
    Auth-->>API: Authorized
    API->>DocSvc: createDocument(orgId, communityId, payload, actor)
    DocSvc->>DocSvc: Validate MIME type, size & checksum
    DocSvc->>DB: Atomic create Document + DocumentVersion (v1)
    DB-->>DocSvc: { document, version }
    DocSvc->>Bus: publish('document.created.v1', payload)
    DocSvc-->>API: DocumentSummaryDto
    API-->>User: 201 Created (Document Details)
```

## 2. Authorized Streaming Download Flow

1. Client requests `GET /documents/:id/download?version=N`.
2. `DocumentsController` resolves requested `Document` and target `DocumentVersion`.
3. `DocumentAuthorizationService` verifies actor has tenant access and clearance for the document's `classification` (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`).
4. Verifies version status is `ACTIVE` (rejects `QUARANTINED` files).
5. `ObjectStorageProvider` opens readable stream for the `storageKey`.
6. API pipes stream directly to client response with proper `Content-Type` and `Content-Disposition: attachment; filename="..."` headers without loading entire binary into server RAM.
