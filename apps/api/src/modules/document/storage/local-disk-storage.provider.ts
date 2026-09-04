import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Readable } from 'stream';
import type { ServerStorageProvider } from './storage-provider.interface.js';
import type { StorageMetadata, StorageUploadResult } from '@community-os/types';
import { LoggerService } from '../../logger/logger.service.js';

@Injectable()
export class LocalDiskStorageProvider implements ServerStorageProvider, OnModuleInit {
  private readonly baseStorageDir = path.resolve(process.cwd(), 'storage', 'documents');

  constructor(private readonly logger: LoggerService) {}

  async onModuleInit(): Promise<void> {
    try {
      await fs.mkdir(this.baseStorageDir, { recursive: true });
      this.logger.log(
        `LocalDiskStorageProvider initialized at: ${this.baseStorageDir}`,
        'LocalDiskStorageProvider',
      );
    } catch (err) {
      this.logger.error(
        `Failed to create storage directory: ${(err as Error).message}`,
        (err as Error).stack,
        'LocalDiskStorageProvider',
      );
    }
  }

  private resolveSafePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.resolve(this.baseStorageDir, normalized);

    if (!absolutePath.startsWith(this.baseStorageDir)) {
      throw new Error(`Directory traversal attempt detected: ${storageKey}`);
    }

    return absolutePath;
  }

  async putObject(
    storageKey: string,
    content: Uint8Array | ArrayBuffer | string,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    const targetPath = this.resolveSafePath(storageKey);
    const parentDir = path.dirname(targetPath);

    await fs.mkdir(parentDir, { recursive: true });

    const buffer = Buffer.isBuffer(content)
      ? content
      : typeof content === 'string'
        ? Buffer.from(content)
        : Buffer.from(content as ArrayBuffer);

    await fs.writeFile(targetPath, buffer);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = BigInt(buffer.length);
    const fileName = path.basename(storageKey);

    return {
      storageKey,
      sizeBytes,
      checksum: hash,
      mimeType,
      fileName,
    };
  }

  async getObject(storageKey: string): Promise<{ stream: unknown; metadata: StorageMetadata }> {
    const { stream, metadata } = await this.getObjectStream(storageKey);
    return { stream, metadata };
  }

  async getObjectStream(
    storageKey: string,
  ): Promise<{ stream: Readable; metadata: StorageMetadata }> {
    const targetPath = this.resolveSafePath(storageKey);

    if (!existsSync(targetPath)) {
      throw new Error(`File not found in storage: ${storageKey}`);
    }

    const stat = await fs.stat(targetPath);
    const stream = createReadStream(targetPath);

    const metadata: StorageMetadata = {
      key: storageKey,
      sizeBytes: stat.size,
      mimeType: 'application/octet-stream',
      checksum: '',
      lastModified: stat.mtime,
    };

    return { stream, metadata };
  }

  async getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
  ): Promise<{ url: string; storageKey: string; headers: Record<string, string> }> {
    return {
      url: `/api/v1/documents/upload-direct?storageKey=${encodeURIComponent(storageKey)}`,
      storageKey,
      headers: { 'Content-Type': mimeType },
    };
  }

  async getPresignedDownloadUrl(storageKey: string): Promise<string> {
    return `/api/v1/documents/stream?storageKey=${encodeURIComponent(storageKey)}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    const targetPath = this.resolveSafePath(storageKey);
    if (existsSync(targetPath)) {
      await fs.unlink(targetPath);
    }
  }

  async headObject(storageKey: string): Promise<StorageMetadata | null> {
    const targetPath = this.resolveSafePath(storageKey);
    if (!existsSync(targetPath)) return null;

    const stat = await fs.stat(targetPath);
    return {
      key: storageKey,
      sizeBytes: stat.size,
      mimeType: 'application/octet-stream',
      checksum: '',
      lastModified: stat.mtime,
    };
  }
}
