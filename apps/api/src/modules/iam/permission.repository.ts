import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Permission } from '@community-os/types';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { code: { in: codes } },
    });
  }
}
