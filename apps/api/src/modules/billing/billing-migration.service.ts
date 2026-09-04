import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { LiabilityResolverService } from './liability-resolver.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';

@Injectable()
export class BillingMigrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liabilityResolver: LiabilityResolverService,
    private readonly ledgerService: ResidentLedgerService,
  ) {}

  async importOpeningBalances(params: {
    communityId: string;
    records: Array<{
      unitNumber: string;
      accountDisplayName: string;
      accountType?: any;
      openingOutstanding: number;
      openingAdvanceCredit: number;
      asOfDate: string;
    }>;
  }): Promise<{ imported: number; totalOutstanding: number; totalAdvanceCredit: number }> {
    let imported = 0;
    let totalOutstanding = 0;
    let totalAdvanceCredit = 0;

    for (const rec of params.records) {
      const unit = await this.prisma.unit.findFirst({
        where: { communityId: params.communityId, unitNumber: rec.unitNumber },
      });

      if (!unit) continue;

      const billableAccount = await this.liabilityResolver.resolveLiableAccountForUnit(
        params.communityId,
        unit.id,
      );

      const _residentAccount = await this.prisma.residentAccount.upsert({
        where: { billableAccountId: billableAccount.id },
        update: {
          openingBalance: rec.openingOutstanding,
          advanceCredit: rec.openingAdvanceCredit,
          currentBalance: rec.openingOutstanding - rec.openingAdvanceCredit,
        },
        create: {
          billableAccount: { connect: { id: billableAccount.id } },
          accountNumber: `RA-${unit.unitNumber}`,
          openingBalance: rec.openingOutstanding,
          advanceCredit: rec.openingAdvanceCredit,
          currentBalance: rec.openingOutstanding - rec.openingAdvanceCredit,
        },
      });

      if (rec.openingOutstanding > 0) {
        await this.ledgerService.postEntry({
          billableAccountId: billableAccount.id,
          entryDate: new Date(rec.asOfDate),
          entryType: 'OPENING',
          referenceType: 'OPENING_BALANCE',
          referenceId: `OB-${unit.unitNumber}`,
          debit: rec.openingOutstanding,
          credit: 0,
          description: 'Migrated Opening Receivables Balance',
        });
        totalOutstanding += rec.openingOutstanding;
      }

      if (rec.openingAdvanceCredit > 0) {
        await this.ledgerService.postEntry({
          billableAccountId: billableAccount.id,
          entryDate: new Date(rec.asOfDate),
          entryType: 'OPENING',
          referenceType: 'OPENING_ADVANCE',
          referenceId: `OBA-${unit.unitNumber}`,
          debit: 0,
          credit: rec.openingAdvanceCredit,
          description: 'Migrated Opening Advance Credit Balance',
        });
        totalAdvanceCredit += rec.openingAdvanceCredit;
      }

      imported++;
    }

    return { imported, totalOutstanding, totalAdvanceCredit };
  }
}
