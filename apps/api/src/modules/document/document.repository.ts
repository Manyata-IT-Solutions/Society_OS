import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Document,
  DocumentVersion,
  DocumentCategory,
  DocumentClassification,
  DocumentStatus,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface CreateDocumentRecordData {
  organizationId: string;
  communityId?: string | null;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  classification: DocumentClassification;
  status?: DocumentStatus;
  retentionDate?: Date | null;
  createdById?: string | null;
  initialVersion: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: bigint;
    checksum: string;
    storageKey: string;
  };
}

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithInitialVersion(
    data: CreateDocumentRecordData,
  ): Promise<{ document: Document; version: DocumentVersion }> {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          organizationId: data.organizationId,
          communityId: data.communityId || null,
          title: data.title,
          description: data.description || null,
          category: data.category,
          classification: data.classification,
          status: data.status || 'ACTIVE',
          retentionDate: data.retentionDate || null,
          createdById: data.createdById || null,
          version: 1,
        },
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          storageKey: data.initialVersion.storageKey,
          fileName: data.initialVersion.fileName,
          originalFileName: data.initialVersion.originalFileName,
          mimeType: data.initialVersion.mimeType,
          sizeBytes: data.initialVersion.sizeBytes,
          checksum: data.initialVersion.checksum,
          status: 'ACTIVE',
          uploadedById: data.createdById || null,
        },
      });

      const updatedDoc = await tx.document.update({
        where: { id: document.id },
        data: { currentVersionId: version.id },
      });

      return {
        document: updatedDoc as unknown as Document,
        version: version as unknown as DocumentVersion,
      };
    });
  }

  async findById(id: string): Promise<Document | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });
    return doc as unknown as Document | null;
  }

  async findMany(params: {
    organizationId?: string;
    communityId?: string;
    category?: DocumentCategory;
    classification?: DocumentClassification;
    status?: DocumentStatus;
    search?: string;
    resourceType?: string;
    resourceId?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Document[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {};

    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.communityId) where.communityId = params.communityId;
    if (params.category) where.category = params.category;
    if (params.classification) where.classification = params.classification;
    if (params.status) where.status = params.status;

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.resourceType && params.resourceId) {
      where.links = {
        some: {
          resourceType: params.resourceType,
          resourceId: params.resourceId,
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: params.sortOrder || 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: items as unknown as Document[],
      total,
      page,
      limit,
    };
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      category?: DocumentCategory;
      classification?: DocumentClassification;
      status?: DocumentStatus;
      currentVersionId?: string | null;
      isLocked?: boolean;
      retentionDate?: Date | null;
    },
  ): Promise<Document> {
    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.classification && { classification: data.classification }),
        ...(data.status && { status: data.status }),
        ...(data.currentVersionId !== undefined && { currentVersionId: data.currentVersionId }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
        ...(data.retentionDate !== undefined && { retentionDate: data.retentionDate }),
        version: { increment: 1 },
      },
    });
    return doc as unknown as Document;
  }
}
