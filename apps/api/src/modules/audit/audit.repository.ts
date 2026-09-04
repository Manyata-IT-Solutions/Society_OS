import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  AuditRecord,
  AuditQueryFilters,
  AuditActorType,
  AuditResult,
  AuditClassification,
  AuditRetentionCategory,
  ScopeType,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface CreateAuditRecordInput {
  organizationId?: string | null;
  communityId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  sessionId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceScope?: ScopeType;
  result?: AuditResult;
  requestId?: string | null;
  correlationId?: string | null;
  occurredAt?: Date;
  source?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  changes?: Record<string, { before: unknown; after: unknown }> | null;
  classification?: AuditClassification;
  retentionCategory?: AuditRetentionCategory;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditRecordInput): Promise<AuditRecord> {
    const record = await this.prisma.auditRecord.create({
      data: {
        organizationId: data.organizationId || null,
        communityId: data.communityId || null,
        actorType: data.actorType,
        actorId: data.actorId || null,
        sessionId: data.sessionId || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        resourceScope: data.resourceScope || 'COMMUNITY',
        result: data.result || 'SUCCESS',
        requestId: data.requestId || null,
        correlationId: data.correlationId || null,
        occurredAt: data.occurredAt || new Date(),
        source: data.source || 'api',
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        reason: data.reason || null,
        metadata: (data.metadata as Prisma.InputJsonValue) || {},
        beforeSnapshot: (data.beforeSnapshot as Prisma.InputJsonValue) || undefined,
        afterSnapshot: (data.afterSnapshot as Prisma.InputJsonValue) || undefined,
        changes: (data.changes as Prisma.InputJsonValue) || undefined,
        classification: data.classification || 'INTERNAL',
        retentionCategory: data.retentionCategory || 'OPERATIONAL',
      },
    });

    return record as unknown as AuditRecord;
  }

  async findById(id: string): Promise<AuditRecord | null> {
    const record = await this.prisma.auditRecord.findUnique({
      where: { id },
    });
    return record as unknown as AuditRecord | null;
  }

  async findMany(
    filters: AuditQueryFilters,
  ): Promise<{ items: AuditRecord[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditRecordWhereInput = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.communityId) {
      where.communityId = filters.communityId;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.actorType) {
      where.actorType = filters.actorType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }
    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }
    if (filters.result) {
      where.result = filters.result;
    }
    if (filters.classification) {
      where.classification = filters.classification;
    }
    if (filters.retentionCategory) {
      where.retentionCategory = filters.retentionCategory;
    }

    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) {
        where.occurredAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.occurredAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { resourceType: { contains: filters.search, mode: 'insensitive' } },
        { resourceId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: filters.sortOrder || 'desc' },
      }),
      this.prisma.auditRecord.count({ where }),
    ]);

    return {
      items: items as unknown as AuditRecord[],
      total,
      page,
      limit,
    };
  }
}
