import type { StorageMetadata, ObjectStorageProvider } from '@community-os/types';
import type { Readable } from 'stream';

export interface ServerStorageProvider extends ObjectStorageProvider {
  getObjectStream(storageKey: string): Promise<{ stream: Readable; metadata: StorageMetadata }>;
}
