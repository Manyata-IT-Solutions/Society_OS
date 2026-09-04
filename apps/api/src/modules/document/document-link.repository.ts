import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { DocumentLink, DocumentRelationshipType } from '@community-os/types';

export interface CreateDocumentLinkData {
  organizationId: string;
  communityId?: string | null;
  documentId: string;
  resourceType: string;
  resourceId: string;
  relationshipType: DocumentRelationshipType;
  createdById?: string | null;
}

@Injectable()
export class DocumentLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentLinkData): Promise<DocumentLink> {
    const link = await this.prisma.documentLink.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId || null,
        documentId: data.documentId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        relationshipType: data.relationshipType,
        createdById: data.createdById || null,
      },
    });
    return link as unknown as DocumentLink;
  }

  async findById(id: string): Promise<DocumentLink | null> {
    const link = await this.prisma.documentLink.findUnique({
      where: { id },
      include: { document: true },
    });
    return link as unknown as DocumentLink | null;
  }

  async findByResource(resourceType: string, resourceId: string): Promise<DocumentLink[]> {
    const links = await this.prisma.documentLink.findMany({
      where: { resourceType, resourceId },
      include: { document: true },
      orderBy: { createdAt: 'desc' },
    });
    return links as unknown as DocumentLink[];
  }

  async findByDocumentId(documentId: string): Promise<DocumentLink[]> {
    const links = await this.prisma.documentLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    return links as unknown as DocumentLink[];
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.prisma.documentLink.deleteMany({
      where: { id },
    });
    return res.count > 0;
  }
}
