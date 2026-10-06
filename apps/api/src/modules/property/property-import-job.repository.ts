import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { PropertyImportJob, PropertyImportStatus } from '@community-os/types';
import type { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class PropertyImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PropertyImportJob | null> {
    const record = await this.prisma.propertyImportJob.findUnique({
      where: { id },
    });
    return (record as unknown as PropertyImportJob) || null;
  }

  async create(data: {
    organizationId: string;
    communityId: string;
    status?: PropertyImportStatus;
    totalRows: number;
    successRows?: number;
    failedRows?: number;
    errors?: Record<string, unknown>[];
    sourceFileName?: string | null;
    createdBy?: string | null;
  }): Promise<PropertyImportJob> {
    const record = await this.prisma.propertyImportJob.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId,
        status: data.status || 'PROCESSING',
        totalRows: data.totalRows,
        successRows: data.successRows || 0,
        failedRows: data.failedRows || 0,
        errors: (data.errors || []) as unknown as InputJsonValue,
        sourceFileName: data.sourceFileName || null,
        createdBy: data.createdBy || null,
      },
    });
    return record as unknown as PropertyImportJob;
  }

  async updateStatus(
    id: string,
    status: PropertyImportStatus,
    successRows: number,
    failedRows: number,
    errors: Record<string, unknown>[],
  ): Promise<PropertyImportJob> {
    const record = await this.prisma.propertyImportJob.update({
      where: { id },
      data: {
        status,
        successRows,
        failedRows,
        errors: errors as unknown as InputJsonValue,
        completedAt: new Date(),
      },
    });
    return record as unknown as PropertyImportJob;
  }
}
