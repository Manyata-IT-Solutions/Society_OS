import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { ResidentImportJob, ResidentImportStatus } from '@community-os/types';
import type { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class ResidentImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ResidentImportJob | null> {
    const record = await this.prisma.residentImportJob.findUnique({
      where: { id },
    });
    return (record as unknown as ResidentImportJob) || null;
  }

  async create(data: {
    organizationId: string;
    communityId: string;
    status?: ResidentImportStatus;
    totalRows: number;
    successRows?: number;
    failedRows?: number;
    errors?: Record<string, unknown>[];
    sourceFileName?: string | null;
    createdBy?: string | null;
  }): Promise<ResidentImportJob> {
    const record = await this.prisma.residentImportJob.create({
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
    return record as unknown as ResidentImportJob;
  }

  async updateStatus(
    id: string,
    status: ResidentImportStatus,
    successRows: number,
    failedRows: number,
    errors: Record<string, unknown>[],
  ): Promise<ResidentImportJob> {
    const record = await this.prisma.residentImportJob.update({
      where: { id },
      data: {
        status,
        successRows,
        failedRows,
        errors: errors as unknown as InputJsonValue,
        completedAt: new Date(),
      },
    });
    return record as unknown as ResidentImportJob;
  }
}
