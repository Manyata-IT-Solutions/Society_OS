import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { DocumentVersion, DocumentVersionStatus } from '@community-os/types';

export interface CreateDocumentVersionInput {
  documentId: string;
  versionNumber: number;
  storageKey: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksum: string;
  status?: DocumentVersionStatus;
  uploadedById?: string | null;
}

@Injectable()
export class DocumentVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentVersionInput): Promise<DocumentVersion> {
    const version = await this.prisma.documentVersion.create({
      data: {
        documentId: data.documentId,
        versionNumber: data.versionNumber,
        storageKey: data.storageKey,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        status: data.status || 'ACTIVE',
        uploadedById: data.uploadedById || null,
      },
    });
    return version as unknown as DocumentVersion;
  }

  async findByDocumentIdAndVersion(
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    const version = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });
    return version as unknown as DocumentVersion | null;
  }

  async findById(id: string): Promise<DocumentVersion | null> {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id },
    });
    return version as unknown as DocumentVersion | null;
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
    return versions as unknown as DocumentVersion[];
  }

  async getLatestVersionNumber(documentId: string): Promise<number> {
    const latest = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    return latest ? latest.versionNumber : 0;
  }
}
