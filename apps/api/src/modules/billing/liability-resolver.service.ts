import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BillableAccount } from '@prisma/client';

@Injectable()
export class LiabilityResolverService {
  private readonly logger = new Logger(LiabilityResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveLiableAccountForUnit(communityId: string, unitId: string): Promise<BillableAccount> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { community: true, building: true },
    });

    if (!unit) {
      throw new Error(`Unit ${unitId} not found`);
    }

    const accountNumber = `ACC-${unit.unitNumber}`;

    let billableAccount = await this.prisma.billableAccount.findFirst({
      where: {
        communityId,
        OR: [{ unitId }, { accountNumber }],
      },
      include: { unit: true, residentAccount: true },
    });

    if (billableAccount) {
      if (!billableAccount.unitId) {
        billableAccount = await this.prisma.billableAccount.update({
          where: { id: billableAccount.id },
          data: { unitId },
          include: { unit: true, residentAccount: true },
        });
      }
    } else {
      billableAccount = await this.prisma.billableAccount.create({
        data: {
          organization: { connect: { id: unit.community.organizationId } },
          community: { connect: { id: communityId } },
          unit: { connect: { id: unitId } },
          accountNumber,
          accountType: 'UNIT',
          displayName: `Unit ${unit.unitNumber}`,
          status: 'ACTIVE',
        },
        include: { unit: true, residentAccount: true },
      });
    }

    // Ensure ResidentAccount exists
    const residentAccount = await this.prisma.residentAccount.findUnique({
      where: { billableAccountId: billableAccount.id },
    });

    if (!residentAccount) {
      await this.prisma.residentAccount.create({
        data: {
          billableAccount: { connect: { id: billableAccount.id } },
          accountNumber: `RA-${unit.unitNumber}`,
          openingBalance: 0,
          currentBalance: 0,
        },
      });
    }

    return billableAccount;
  }
}
