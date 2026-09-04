import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PropertyImportJobRepository } from './property-import-job.repository.js';
import { SectionRepository } from './section.repository.js';
import { BuildingRepository } from './building.repository.js';
import { FloorRepository } from './floor.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type { PropertyImportRowInput, PropertyImportCommitInput } from '@community-os/validation';
import type {
  PropertyImportValidationResultDto,
  PropertyImportJobResponseDto,
} from '@community-os/contracts';
import { toImportJobResponseDto } from '@community-os/contracts';

@Injectable()
export class PropertyImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importJobRepo: PropertyImportJobRepository,
    private readonly sectionRepo: SectionRepository,
    private readonly buildingRepo: BuildingRepository,
    private readonly floorRepo: FloorRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async validateImportRows(
    communityId: string,
    rows: PropertyImportRowInput[],
  ): Promise<PropertyImportValidationResultDto> {
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
      field?: string;
      message: string;
      data?: Record<string, unknown>;
    }> = [];
    const seenUnitKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 1;
      const row = rows[i]!;

      // 1. Check unit number presence
      if (!row.unitNumber || row.unitNumber.trim() === '') {
        errors.push({
          rowNumber,
          field: 'unitNumber',
          message: 'Unit number is required.',
        });
        continue;
      }

      // 2. Check internal duplicate unit in CSV
      const buildingKey = row.buildingCode
        ? row.buildingCode.toUpperCase().trim()
        : '__NO_BUILDING__';
      const unitKey = `${buildingKey}::${row.unitNumber.toUpperCase().trim()}`;

      if (seenUnitKeys.has(unitKey)) {
        errors.push({
          rowNumber,
          field: 'unitNumber',
          message: `Duplicate unit number '${row.unitNumber}' within the same building in CSV file.`,
        });
      } else {
        seenUnitKeys.add(unitKey);
      }

      // 3. Floor requires building
      if (row.floorLabel && !row.buildingCode) {
        errors.push({
          rowNumber,
          field: 'floorLabel',
          message: 'Floor label cannot be specified without a Building code.',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      validRowsCount: rows.length - errors.length,
      errorRowsCount: errors.length,
      errors,
      previewRows: rows.slice(0, 20) as unknown as Record<string, unknown>[],
    };
  }

  async commitImport(
    communityId: string,
    input: PropertyImportCommitInput,
    userId?: string,
  ): Promise<PropertyImportJobResponseDto> {
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

    // 1. Pre-validate
    const validation = await this.validateImportRows(communityId, input.rows);
    if (!validation.isValid) {
      throw new DomainException(
        'PROPERTY_IMPORT_VALIDATION_FAILED',
        `CSV import failed validation with ${validation.errorRowsCount} errors. Please fix and re-upload.`,
        HttpStatus.BAD_REQUEST,
        validation.errors.map((e) => ({ field: e.field, message: e.message })),
      );
    }

    // 2. Create job record
    const job = await this.importJobRepo.create({
      organizationId: community.organizationId,
      communityId,
      status: 'PROCESSING',
      totalRows: input.rows.length,
      sourceFileName: input.sourceFileName,
      createdBy: userId,
    });

    try {
      // 3. Process records inside a transaction
      const sectionMap = new Map<string, string>(); // code -> id
      const buildingMap = new Map<string, string>(); // code -> id
      const floorMap = new Map<string, string>(); // buildingCode::label -> id

      let successCount = 0;

      for (const row of input.rows) {
        // Section
        let sectionId: string | null = null;
        if (row.sectionCode) {
          const sCode = row.sectionCode.toUpperCase().trim();
          if (!sectionMap.has(sCode)) {
            let section = await this.sectionRepo.findByCode(communityId, sCode);
            if (!section) {
              section = await this.sectionRepo.create(community.organizationId, communityId, {
                code: sCode,
                name: row.sectionName || `Section ${sCode}`,
                sortOrder: 0,
              });
            }
            sectionMap.set(sCode, section.id);
          }
          sectionId = sectionMap.get(sCode)!;
        }

        // Building
        let buildingId: string | null = null;
        if (row.buildingCode) {
          const bCode = row.buildingCode.toUpperCase().trim();
          if (!buildingMap.has(bCode)) {
            let building = await this.buildingRepo.findByCode(communityId, bCode);
            if (!building) {
              building = await this.buildingRepo.create(community.organizationId, communityId, {
                code: bCode,
                name: row.buildingName || `Building ${bCode}`,
                sectionId: sectionId || undefined,
                buildingType: row.buildingType || 'TOWER',
                sortOrder: 0,
              });
            }
            buildingMap.set(bCode, building.id);
          }
          buildingId = buildingMap.get(bCode)!;
        }

        // Floor
        let floorId: string | null = null;
        if (row.floorLabel && buildingId) {
          const fKey = `${buildingId}::${row.floorLabel.trim()}`;
          if (!floorMap.has(fKey)) {
            let floor = await this.floorRepo.findByLabel(buildingId, row.floorLabel);
            if (!floor) {
              floor = await this.floorRepo.create(
                community.organizationId,
                communityId,
                buildingId,
                {
                  label: row.floorLabel.trim(),
                  sortOrder: 0,
                },
              );
            }
            floorMap.set(fKey, floor.id);
          }
          floorId = floorMap.get(fKey)!;
        }

        // Unit (Upsert / Create)
        const unitNumber = row.unitNumber.trim();
        const existingUnit = await this.prisma.unit.findFirst({
          where: {
            communityId,
            buildingId,
            unitNumber,
          },
        });

        if (existingUnit) {
          await this.prisma.unit.update({
            where: { id: existingUnit.id },
            data: {
              sectionId,
              floorId,
              displayName: row.displayName || unitNumber,
              unitType: row.unitType || 'APARTMENT',
              status: row.status || 'ACTIVE',
              carpetArea: row.carpetArea ?? existingUnit.carpetArea,
              builtUpArea: row.builtUpArea ?? existingUnit.builtUpArea,
              superBuiltUpArea: row.superBuiltUpArea ?? existingUnit.superBuiltUpArea,
              areaUnit: row.areaUnit || 'SQFT',
              bedroomCount: row.bedroomCount ?? existingUnit.bedroomCount,
              bathroomCount: row.bathroomCount ?? existingUnit.bathroomCount,
            },
          });
        } else {
          await this.prisma.unit.create({
            data: {
              organizationId: community.organizationId,
              communityId,
              sectionId,
              buildingId,
              floorId,
              unitNumber,
              displayName: row.displayName || unitNumber,
              unitType: row.unitType || 'APARTMENT',
              status: row.status || 'ACTIVE',
              carpetArea: row.carpetArea ?? null,
              builtUpArea: row.builtUpArea ?? null,
              superBuiltUpArea: row.superBuiltUpArea ?? null,
              areaUnit: row.areaUnit || 'SQFT',
              bedroomCount: row.bedroomCount ?? null,
              bathroomCount: row.bathroomCount ?? null,
              version: 1,
            },
          });
        }

        successCount++;
      }

      const updatedJob = await this.importJobRepo.updateStatus(
        job.id,
        'COMPLETED',
        successCount,
        0,
        [],
      );

      this.logger.log(
        `Property CSV import completed: ${successCount} rows`,
        'PropertyImportExportService',
      );

      await this.eventsService.publish(
        createEvent(
          DOMAIN_EVENT_NAMES.PROPERTY_IMPORT_COMPLETED,
          {
            jobId: job.id,
            organizationId: community.organizationId,
            communityId,
            totalRows: input.rows.length,
            successRows: successCount,
            failedRows: 0,
          },
          { organizationId: community.organizationId, communityId },
        ),
      );

      return toImportJobResponseDto(updatedJob);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Import failed unexpectedly.';
      await this.importJobRepo.updateStatus(job.id, 'FAILED', 0, input.rows.length, [
        { message: errorMessage },
      ]);
      throw err;
    }
  }

  async exportUnitsCsv(communityId: string): Promise<string> {
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

    const units = await this.prisma.unit.findMany({
      where: { communityId },
      include: {
        section: true,
        building: true,
        floor: true,
      },
      orderBy: [{ unitNumber: 'asc' }],
    });

    const headers = [
      'Unit Number',
      'Display Name',
      'Unit Type',
      'Status',
      'Building Code',
      'Building Name',
      'Floor',
      'Section Code',
      'Section Name',
      'Carpet Area',
      'Built-Up Area',
      'Super Built-Up Area',
      'Area Unit',
      'Bedrooms',
      'Bathrooms',
    ];

    const rows = units.map((u) => [
      this.sanitizeForCsv(u.unitNumber),
      this.sanitizeForCsv(u.displayName),
      this.sanitizeForCsv(u.unitType),
      this.sanitizeForCsv(u.status),
      this.sanitizeForCsv(u.building?.code || ''),
      this.sanitizeForCsv(u.building?.name || ''),
      this.sanitizeForCsv(u.floor?.label || ''),
      this.sanitizeForCsv(u.section?.code || ''),
      this.sanitizeForCsv(u.section?.name || ''),
      u.carpetArea ? String(u.carpetArea) : '',
      u.builtUpArea ? String(u.builtUpArea) : '',
      u.superBuiltUpArea ? String(u.superBuiltUpArea) : '',
      this.sanitizeForCsv(u.areaUnit),
      u.bedroomCount ? String(u.bedroomCount) : '',
      u.bathroomCount ? String(u.bathroomCount) : '',
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ];

    return csvLines.join('\n');
  }

  // Prevents spreadsheet formula injection attacks (=, +, -, @)
  private sanitizeForCsv(value: string): string {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (/^[=+\-@]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
}
