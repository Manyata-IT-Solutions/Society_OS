import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentImportJobRepository } from './resident-import-job.repository.js';
import { ResidentRepository } from './resident.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { ResidentImportRowInput, CommitResidentImportInput } from '@community-os/validation';
import type {
  ResidentImportValidationResultDto,
  ResidentImportJobResponseDto,
} from '@community-os/contracts';
import { toResidentImportJobResponseDto } from '@community-os/contracts';

@Injectable()
export class ResidentImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importJobRepo: ResidentImportJobRepository,
    private readonly residentRepo: ResidentRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async validateImportRows(
    communityId: string,
    rows: ResidentImportRowInput[],
  ): Promise<ResidentImportValidationResultDto> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    const errors: Array<{
      rowNumber: number;
      field: string;
      message: string;
      value?: unknown;
    }> = [];

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 1;

      // 1. Validate required fields
      if (!row.firstName || row.firstName.trim() === '') {
        errors.push({ rowNumber: rowNum, field: 'firstName', message: 'First name is required.' });
      }
      if (!row.lastName || row.lastName.trim() === '') {
        errors.push({ rowNumber: rowNum, field: 'lastName', message: 'Last name is required.' });
      }
      if (!row.unitNumber || row.unitNumber.trim() === '') {
        errors.push({
          rowNumber: rowNum,
          field: 'unitNumber',
          message: 'Unit number is required.',
        });
      }

      // 2. Intra-batch duplicate check
      if (row.email && row.email.trim() !== '') {
        const normEmail = row.email.toLowerCase().trim();
        if (seenEmails.has(normEmail)) {
          errors.push({
            rowNumber: rowNum,
            field: 'email',
            message: `Duplicate email '${row.email}' within import file.`,
            value: row.email,
          });
        }
        seenEmails.add(normEmail);
      }

      if (row.phone && row.phone.trim() !== '') {
        const normPhone = row.phone.trim();
        if (seenPhones.has(normPhone)) {
          errors.push({
            rowNumber: rowNum,
            field: 'phone',
            message: `Duplicate phone number '${row.phone}' within import file.`,
            value: row.phone,
          });
        }
        seenPhones.add(normPhone);
      }

      // 3. Database Unit resolution
      let unit = null;
      if (row.buildingCode) {
        unit = await this.prisma.unit.findFirst({
          where: {
            communityId,
            unitNumber: row.unitNumber.trim(),
            building: { code: row.buildingCode.trim() },
          },
        });
      } else {
        unit = await this.prisma.unit.findFirst({
          where: {
            communityId,
            unitNumber: row.unitNumber.trim(),
          },
        });
      }

      if (!unit) {
        errors.push({
          rowNumber: rowNum,
          field: 'unitNumber',
          message: `Unit '${row.unitNumber}'${row.buildingCode ? ` in building '${row.buildingCode}'` : ''} not found in this community.`,
          value: row.unitNumber,
        });
      }
    }

    const errorRowIndices = new Set(errors.map((e) => e.rowNumber));
    const validRowsCount = rows.length - errorRowIndices.size;

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      validRowsCount,
      errorRowsCount: errorRowIndices.size,
      errors,
      previewRows: rows.slice(0, 10) as unknown as Array<Record<string, unknown>>,
    };
  }

  async commitImport(
    communityId: string,
    input: CommitResidentImportInput,
    createdBy?: string,
  ): Promise<ResidentImportJobResponseDto> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 1. Create Job record
    const job = await this.importJobRepo.create({
      organizationId: community.organizationId,
      communityId,
      totalRows: input.rows.length,
      sourceFileName: input.sourceFileName || null,
      createdBy: createdBy || null,
    });

    try {
      let successCount = 0;

      await this.prisma.$transaction(async (tx) => {
        for (const row of input.rows) {
          // Resolve unit
          let unit = null;
          if (row.buildingCode) {
            unit = await tx.unit.findFirst({
              where: {
                communityId,
                unitNumber: row.unitNumber.trim(),
                building: { code: row.buildingCode.trim() },
              },
            });
          } else {
            unit = await tx.unit.findFirst({
              where: {
                communityId,
                unitNumber: row.unitNumber.trim(),
              },
            });
          }

          if (!unit) {
            throw new DomainException(
              'UNIT_NOT_FOUND',
              `Cannot commit import: Unit '${row.unitNumber}' not found.`,
              HttpStatus.BAD_REQUEST,
            );
          }

          // Check or create resident
          let resident = null;
          if (row.email) {
            resident = await tx.resident.findFirst({
              where: { communityId, email: { equals: row.email.trim(), mode: 'insensitive' } },
            });
          }
          if (!resident && row.phone) {
            resident = await tx.resident.findFirst({
              where: { communityId, phone: row.phone.trim() },
            });
          }

          if (!resident) {
            const displayName = `${row.firstName.trim()} ${row.lastName.trim()}`.trim();
            resident = await tx.resident.create({
              data: {
                organizationId: community.organizationId,
                communityId,
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                displayName,
                phone: row.phone?.trim() || null,
                email: row.email?.toLowerCase().trim() || null,
                status: 'ACTIVE',
                preferredLanguage: 'en',
                version: 1,
              },
            });
          }

          const startDate = row.startDate ? new Date(row.startDate) : new Date();

          // If OWNER -> create ownership
          if (row.roleInUnit === 'OWNER') {
            const existingOwnership = await tx.unitOwnership.findFirst({
              where: { unitId: unit.id, residentId: resident.id, status: 'ACTIVE' },
            });

            if (!existingOwnership) {
              await tx.unitOwnership.create({
                data: {
                  organizationId: community.organizationId,
                  communityId,
                  unitId: unit.id,
                  residentId: resident.id,
                  ownershipShare: row.ownershipShare ?? null,
                  ownershipType: 'SOLE',
                  isPrimaryOwner: Boolean(row.isPrimaryContact),
                  startDate,
                  status: 'ACTIVE',
                  version: 1,
                },
              });
            }
          }

          // Resolve or create active Household
          let household = await tx.household.findFirst({
            where: { unitId: unit.id, status: 'ACTIVE' },
          });

          if (!household) {
            household = await tx.household.create({
              data: {
                organizationId: community.organizationId,
                communityId,
                unitId: unit.id,
                name: `${row.lastName.trim()} Household`,
                primaryContactResidentId: resident.id,
                startDate,
                status: 'ACTIVE',
                version: 1,
              },
            });
          }

          // Add Household Member
          const existingMember = await tx.householdMember.findUnique({
            where: {
              householdId_residentId: { householdId: household.id, residentId: resident.id },
            },
          });

          if (!existingMember) {
            await tx.householdMember.create({
              data: {
                organizationId: community.organizationId,
                communityId,
                householdId: household.id,
                residentId: resident.id,
                relationshipType: row.relationshipType || 'SELF',
                isPrimaryContact: Boolean(row.isPrimaryContact),
                status: 'ACTIVE',
                joinedAt: startDate,
                version: 1,
              },
            });
          }

          // Ensure Occupancy exists
          const existingOccupancy = await tx.unitOccupancy.findFirst({
            where: { unitId: unit.id, status: 'ACTIVE' },
          });

          if (!existingOccupancy) {
            await tx.unitOccupancy.create({
              data: {
                organizationId: community.organizationId,
                communityId,
                unitId: unit.id,
                householdId: household.id,
                occupancyType: row.roleInUnit === 'OWNER' ? 'OWNER_OCCUPIED' : 'TENANT_OCCUPIED',
                startDate,
                status: 'ACTIVE',
                version: 1,
              },
            });
          }

          // If TENANT -> create tenancy
          if (row.roleInUnit === 'TENANT') {
            const existingTenancy = await tx.unitTenancy.findFirst({
              where: { unitId: unit.id, householdId: household.id, status: 'ACTIVE' },
            });

            if (!existingTenancy) {
              await tx.unitTenancy.create({
                data: {
                  organizationId: community.organizationId,
                  communityId,
                  unitId: unit.id,
                  householdId: household.id,
                  startDate,
                  status: 'ACTIVE',
                  version: 1,
                },
              });
            }
          }

          successCount++;
        }
      });

      const updatedJob = await this.importJobRepo.updateStatus(
        job.id,
        'COMPLETED',
        successCount,
        0,
        [],
      );

      this.logger.log(
        `Resident CSV import completed: ${successCount} rows`,
        'ResidentImportExportService',
      );

      return toResidentImportJobResponseDto(updatedJob);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Resident import failed unexpectedly.';
      await this.importJobRepo.updateStatus(job.id, 'FAILED', 0, input.rows.length, [
        { message: errorMessage },
      ]);
      throw err;
    }
  }

  async exportResidentsCsv(communityId: string): Promise<string> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    const residents = await this.residentRepo.findMany(communityId, {
      page: 1,
      limit: 10000,
      sortOrder: 'asc',
    });

    const headers = [
      'Resident ID',
      'Display Name',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Status',
      'Active Owned Units',
      'Active Occupied Units',
      'Has User Account',
      'Created At',
    ];

    const lines: string[] = [headers.join(',')];

    for (const r of residents.items) {
      const ownedUnits = (r.ownerships || [])
        .map((o) => o.unit?.unitNumber)
        .filter(Boolean)
        .join('; ');
      const occupiedUnits = (r.householdMembers || []).map((m) => m.householdId).join('; ');

      const row = [
        this.sanitizeForCsv(r.id),
        this.sanitizeForCsv(r.displayName || `${r.firstName} ${r.lastName}`),
        this.sanitizeForCsv(r.firstName),
        this.sanitizeForCsv(r.lastName),
        this.sanitizeForCsv(r.phone || ''),
        this.sanitizeForCsv(r.email || ''),
        this.sanitizeForCsv(r.status),
        this.sanitizeForCsv(ownedUnits),
        this.sanitizeForCsv(occupiedUnits),
        this.sanitizeForCsv(r.userId ? 'YES' : 'NO'),
        this.sanitizeForCsv(
          r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        ),
      ];

      lines.push(row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','));
    }

    return lines.join('\r\n');
  }

  private sanitizeForCsv(value: string): string {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (/^[=+\-@]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
}
