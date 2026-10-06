import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AssetSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async nextAssetCode(
    organizationId: string,
    communityId: string,
    prefix = 'AST',
  ): Promise<string> {
    const year = new Date().getUTCFullYear();

    return this.prisma.$transaction(async (tx) => {
      // Find latest asset created in this community this year with this prefix
      const count = await tx.asset.count({
        where: {
          organizationId,
          communityId,
          assetCode: {
            startsWith: `${prefix}-${year}-`,
          },
        },
      });

      const nextNum = count + 1;
      const formattedNum = String(nextNum).padStart(6, '0');
      return `${prefix}-${year}-${formattedNum}`;
    });
  }
}
