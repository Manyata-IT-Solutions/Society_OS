import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ChartOfAccountsRepository } from './chart-of-accounts.repository.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor } from '@community-os/types';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    private readonly coaRepo: ChartOfAccountsRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createAccount(data: any, actor: Actor) {
    const existing = await this.coaRepo.findAccountByCode(
      data.accountingEntityId,
      data.accountCode,
    );
    if (existing) {
      throw new ConflictException(
        `Account with code ${data.accountCode} already exists in this entity`,
      );
    }

    if (data.parentAccountId) {
      const parent = await this.coaRepo.findAccountById(data.parentAccountId);
      if (!parent) throw new NotFoundException('Parent account not found');
      if (parent.accountingEntityId !== data.accountingEntityId) {
        throw new BadRequestException('Parent account belongs to a different accounting entity');
      }
    }

    const account = await this.coaRepo.createAccount({
      accountingEntity: { connect: { id: data.accountingEntityId } },
      accountCode: data.accountCode,
      name: data.name,
      description: data.description,
      accountType: data.accountType,
      accountSubType: data.accountSubType,
      parentAccount: data.parentAccountId ? { connect: { id: data.parentAccountId } } : undefined,
      postingAllowed: data.postingAllowed ?? true,
      normalBalance: data.normalBalance,
      status: data.status || 'ACTIVE',
      systemAccountKey: data.systemAccountKey,
      isControlAccount: data.isControlAccount ?? false,
      allowManualPosting: data.allowManualPosting ?? true,
      reconciliationRequired: data.reconciliationRequired ?? false,
      currencyRestriction: data.currencyRestriction,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_ACCOUNT_CREATED ?? 'finance.account.created.v1',
        { code: account.accountCode, name: account.name, type: account.accountType },
        {
          organizationId: data.accountingEntityId,
          userId: actor?.id,
        },
      ),
    );

    return account;
  }

  async getAccount(id: string) {
    const acc = await this.coaRepo.findAccountById(id);
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  async listAccounts(accountingEntityId: string, filter?: { accountType?: any; status?: any }) {
    return this.coaRepo.findAccounts(accountingEntityId, filter);
  }

  async updateAccount(id: string, data: any) {
    await this.getAccount(id);
    if (data.parentAccountId && data.parentAccountId === id) {
      throw new BadRequestException('Account cannot be its own parent');
    }
    return this.coaRepo.updateAccount(id, data);
  }

  async createMapping(
    accountingEntityId: string,
    mappingKey: string,
    accountId: string,
    description?: string,
  ) {
    const acc = await this.getAccount(accountId);
    if (acc.accountingEntityId !== accountingEntityId) {
      throw new BadRequestException('Account belongs to a different accounting entity');
    }
    return this.coaRepo.createMapping({
      accountingEntity: { connect: { id: accountingEntityId } },
      mappingKey,
      account: { connect: { id: accountId } },
      description,
    });
  }

  async listMappings(accountingEntityId: string) {
    return this.coaRepo.findMappings(accountingEntityId);
  }

  async applyStandardSocietyTemplate(accountingEntityId: string, _actor: Actor) {
    const standardAccounts = [
      {
        code: '1000',
        name: 'Current Assets',
        type: 'ASSET',
        subType: 'OTHER_CURRENT_ASSET',
        normal: 'DEBIT',
        posting: false,
      },
      {
        code: '1100',
        name: 'Cash and Bank Balances',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: false,
        parent: '1000',
      },
      {
        code: '1110',
        name: 'Primary Operating Bank Account',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        systemKey: 'BANK_PRIMARY',
      },
      {
        code: '1120',
        name: 'Sinking Fund Bank Fixed Deposit',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        systemKey: 'BANK_SINKING_FD',
      },
      {
        code: '1130',
        name: 'Petty Cash',
        type: 'ASSET',
        subType: 'CASH',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        systemKey: 'CASH_PETTY',
      },
      {
        code: '1200',
        name: 'Accounts Receivable (Maintenance Dues)',
        type: 'ASSET',
        subType: 'ACCOUNTS_RECEIVABLE',
        normal: 'DEBIT',
        posting: true,
        parent: '1000',
        systemKey: 'AR_CONTROL',
        isControl: true,
        allowManual: false,
      },
      {
        code: '1300',
        name: 'Vendor Advances',
        type: 'ASSET',
        subType: 'VENDOR_ADVANCE',
        normal: 'DEBIT',
        posting: true,
        parent: '1000',
      },
      {
        code: '1400',
        name: 'Security Deposits Paid',
        type: 'ASSET',
        subType: 'SECURITY_DEPOSIT',
        normal: 'DEBIT',
        posting: true,
        parent: '1000',
      },

      {
        code: '2000',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '2100',
        name: 'Accounts Payable (Trade Creditors)',
        type: 'LIABILITY',
        subType: 'ACCOUNTS_PAYABLE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        systemKey: 'AP_CONTROL',
        isControl: true,
        allowManual: false,
      },
      {
        code: '2200',
        name: 'Resident Advance Payments',
        type: 'LIABILITY',
        subType: 'RESIDENT_ADVANCE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        systemKey: 'RESIDENT_ADVANCE',
        isControl: true,
      },
      {
        code: '2300',
        name: 'Tenant Move-in Security Deposits',
        type: 'LIABILITY',
        subType: 'SECURITY_DEPOSIT',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
      },
      {
        code: '2400',
        name: 'Statutory Taxes Payable (GST/TDS)',
        type: 'LIABILITY',
        subType: 'TAX_PAYABLE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        systemKey: 'TAX_PAYABLE',
      },

      {
        code: '3000',
        name: 'Reserves and Society Funds',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '3100',
        name: 'General Operating Fund',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        systemKey: 'GENERAL_FUND',
      },
      {
        code: '3200',
        name: 'Sinking Fund Reserve',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        systemKey: 'SINKING_FUND',
      },
      {
        code: '3300',
        name: 'Corpus Fund',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        systemKey: 'CORPUS_FUND',
      },
      {
        code: '3400',
        name: 'Major Repair Reserve Fund',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
      },

      {
        code: '4000',
        name: 'Operating & Maintenance Income',
        type: 'INCOME',
        subType: 'MAINTENANCE_INCOME',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '4100',
        name: 'Monthly Resident Maintenance Charges',
        type: 'INCOME',
        subType: 'MAINTENANCE_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
        systemKey: 'MAINTENANCE_INCOME',
      },
      {
        code: '4200',
        name: 'Clubhouse & Amenity Booking Income',
        type: 'INCOME',
        subType: 'AMENITY_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
      },
      {
        code: '4300',
        name: 'Bank Interest & Fixed Deposit Yield',
        type: 'INCOME',
        subType: 'INTEREST_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
      },
      {
        code: '4400',
        name: 'Late Payment Interest & Penalties',
        type: 'INCOME',
        subType: 'PENALTY_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
      },

      {
        code: '5000',
        name: 'Society Operational Expenses',
        type: 'EXPENSE',
        subType: 'ADMIN_EXPENSE',
        normal: 'DEBIT',
        posting: false,
      },
      {
        code: '5100',
        name: 'Repairs & Maintenance Expenses',
        type: 'EXPENSE',
        subType: 'REPAIRS_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5200',
        name: 'Electricity & Utility Bills',
        type: 'EXPENSE',
        subType: 'UTILITIES_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5300',
        name: 'Security Agency Services',
        type: 'EXPENSE',
        subType: 'SECURITY_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5400',
        name: 'Housekeeping & Waste Management',
        type: 'EXPENSE',
        subType: 'HOUSEKEEPING_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5500',
        name: 'Diesel Generator Fuel & Upkeep',
        type: 'EXPENSE',
        subType: 'UTILITIES_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5600',
        name: 'Administrative & Audit Fees',
        type: 'EXPENSE',
        subType: 'PROFESSIONAL_FEES',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
    ];

    const codeToIdMap = new Map<string, string>();

    for (const acc of standardAccounts) {
      let existing = await this.coaRepo.findAccountByCode(accountingEntityId, acc.code);
      if (!existing) {
        existing = await this.coaRepo.createAccount({
          accountingEntity: { connect: { id: accountingEntityId } },
          accountCode: acc.code,
          name: acc.name,
          accountType: acc.type as any,
          accountSubType: acc.subType as any,
          postingAllowed: acc.posting,
          normalBalance: acc.normal as any,
          status: 'ACTIVE',
          systemAccountKey: acc.systemKey ?? null,
          isControlAccount: acc.isControl ?? false,
          allowManualPosting: acc.allowManual ?? true,
        });
      }
      codeToIdMap.set(acc.code, existing.id);
    }

    for (const acc of standardAccounts) {
      const currentId = codeToIdMap.get(acc.code);
      if (acc.parent && currentId) {
        const parentId = codeToIdMap.get(acc.parent);
        if (parentId) {
          await this.coaRepo.updateAccount(currentId, {
            parentAccount: { connect: { id: parentId } },
          });
        }
      }

      if (acc.systemKey && currentId) {
        await this.createMapping(
          accountingEntityId,
          acc.systemKey,
          currentId,
          `System mapping for ${acc.name}`,
        );
      }
    }

    return { appliedCount: standardAccounts.length };
  }
}
