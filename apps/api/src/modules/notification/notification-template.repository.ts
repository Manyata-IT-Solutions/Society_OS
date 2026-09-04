import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  NotificationTemplate,
  NotificationChannel,
  NotificationCategory,
} from '@community-os/types';
import type {
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
} from '@community-os/validation';
import type { Prisma } from '@prisma/client';

@Injectable()
export class NotificationTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string | null,
    communityId: string | null,
    input: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        organizationId,
        communityId,
        code: input.code,
        name: input.name,
        category: input.category,
        channel: input.channel,
        locale: input.locale || 'en',
        subjectTemplate: input.subjectTemplate || null,
        bodyTemplate: input.bodyTemplate,
        variables: input.variables || [],
        isSystem: false,
        isActive: true,
        version: 1,
      },
    });
    return template as unknown as NotificationTemplate;
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    return template as unknown as NotificationTemplate | null;
  }

  async findByCode(
    code: string,
    communityId?: string | null,
    locale = 'en',
    channel: NotificationChannel = 'IN_APP',
  ): Promise<NotificationTemplate | null> {
    // 1. Try community-specific template
    if (communityId) {
      const communityTemplate = await this.prisma.notificationTemplate.findFirst({
        where: {
          communityId,
          code,
          channel: channel as unknown as Prisma.EnumNotificationChannelFilter,
          locale,
          isActive: true,
        },
      });
      if (communityTemplate) return communityTemplate as unknown as NotificationTemplate;
    }

    // 2. Fall back to system / default template
    const defaultTemplate = await this.prisma.notificationTemplate.findFirst({
      where: {
        code,
        channel: channel as unknown as Prisma.EnumNotificationChannelFilter,
        locale,
        isActive: true,
      },
    });

    return defaultTemplate as unknown as NotificationTemplate | null;
  }

  async findMany(params: {
    communityId?: string;
    organizationId?: string;
    category?: NotificationCategory;
    channel?: NotificationChannel;
  }): Promise<NotificationTemplate[]> {
    const where: Prisma.NotificationTemplateWhereInput = {};
    if (params.communityId) where.communityId = params.communityId;
    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.category) where.category = params.category;
    if (params.channel) where.channel = params.channel;

    const templates = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { code: 'asc' },
    });
    return templates as unknown as NotificationTemplate[];
  }

  async update(id: string, input: UpdateNotificationTemplateInput): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.channel !== undefined && { channel: input.channel }),
        ...(input.locale !== undefined && { locale: input.locale }),
        ...(input.subjectTemplate !== undefined && { subjectTemplate: input.subjectTemplate }),
        ...(input.bodyTemplate !== undefined && { bodyTemplate: input.bodyTemplate }),
        ...(input.variables !== undefined && { variables: input.variables }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        version: { increment: 1 },
      },
    });
    return template as unknown as NotificationTemplate;
  }
}
