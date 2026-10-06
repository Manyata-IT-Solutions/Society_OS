# Object Storage Provider Architecture

## 1. Overview

The `ObjectStorageProvider` interface abstracts binary persistence away from database infrastructure:

```typescript
export interface ObjectStorageProvider {
  putObject(
    key: string,
    data: Buffer | Uint8Array,
    options?: StoragePutOptions,
  ): Promise<StoragePutResult>;
  getObjectStream(key: string): Promise<StorageObjectStream>;
  deleteObject(key: string): Promise<boolean>;
  getObjectMetadata(key: string): Promise<StorageObjectMetadata>;
  generatePresignedUploadUrl?(key: string, expiresInSeconds: number): Promise<string>;
  generatePresignedDownloadUrl?(key: string, expiresInSeconds: number): Promise<string>;
}
```

## 2. Implementations

1. **`LocalDiskStorageProvider`** (Default / Development):
   - Stores files locally under `apps/api/storage/documents/`.
   - Validates paths against parent traversal (`..`).
   - Automatically computes SHA-256 integrity hash during upload.
2. **`S3StorageProvider` / `GcsStorageProvider`** (Production Cloud):
   - High-availability distributed blob storage with presigned upload/download URLs for direct client transfer.
