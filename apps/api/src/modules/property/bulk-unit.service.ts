import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BuildingRepository } from './building.repository.js';
import { FloorRepository } from './floor.repository.js';
import { UnitRepository } from './unit.repository.js';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { BulkCreateUnitsInput } from '@community-os/validation';
import type { BulkCreateUnitsResultDto } from '@community-os/contracts';
import { toUnitResponseDto } from '@community-os/contracts';
import type { UnitType, UnitStatus, AreaUnit, Unit } from '@community-os/types';

@Injectable()
export class BulkUnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buildingRepo: BuildingRepository,
    private readonly floorRepo: FloorRepository,
    private readonly unitRepo: UnitRepository,
    private readonly hierarchyService: PropertyHierarchyService,
    private readonly logger: LoggerService,
  ) {}

  async generateBulkUnits(
    communityId: string,
    input: BulkCreateUnitsInput,
  ): Promise<BulkCreateUnitsResultDto> {
    if (input.buildingId) {
      await this.hierarchyService.validateParentConsistency(
        communityId,
        input.sectionId,
        input.buildingId,
      );
    }

    const building = input.buildingId ? await this.buildingRepo.findById(input.buildingId) : null;
    const organizationId = building ? building.organizationId : await this.getOrgId(communityId);

    // 1. Resolve or create floors
    const floorMap = new Map<string, string>(); // floorLabel -> floorId

    if (input.buildingId) {
      for (let i = 0; i < input.floors.length; i++) {
        const f = input.floors[i]!;
        let floorId = f.floorId;

        if (!floorId) {
          let existing = await this.floorRepo.findByLabel(input.buildingId, f.floorLabel);
          if (!existing) {
            existing = await this.floorRepo.create(organizationId, communityId, input.buildingId, {
              label: f.floorLabel,
              levelNumber: f.levelNumber,
              sortOrder: i,
            });
          }
          floorId = existing.id;
        }

        floorMap.set(f.floorLabel, floorId);
      }
    }

    // 2. Generate unit numbers and records
    const unitsToCreate: Array<{
      organizationId: string;
      communityId: string;
      sectionId?: string | null;
      buildingId?: string | null;
      floorId?: string | null;
      unitNumber: string;
      displayName: string;
      unitType: UnitType;
      status: UnitStatus;
      carpetArea?: number | null;
      builtUpArea?: number | null;
      superBuiltUpArea?: number | null;
      areaUnit: AreaUnit;
      bedroomCount?: number | null;
      bathroomCount?: number | null;
      version: number;
    }> = [];

    const existingUnits = await this.prisma.unit.findMany({
      where: {
        communityId,
        buildingId: input.buildingId || null,
      },
      select: { unitNumber: true },
    });
    const existingUnitSet = new Set(existingUnits.map((u) => u.unitNumber.toUpperCase()));

    for (const f of input.floors) {
      const floorId = floorMap.get(f.floorLabel) || null;

      for (const suffix of input.unitSuffixes) {
        // e.g., floor "1" + suffix "01" => "101", floor "G" + suffix "01" => "G-01"
        const unitNumber = /^\d+$/.test(f.floorLabel)
          ? `${f.floorLabel}${suffix}`
          : `${f.floorLabel}-${suffix}`;

        if (existingUnitSet.has(unitNumber.toUpperCase())) {
          throw new DomainException(
            'DUPLICATE_UNIT',
            `Bulk generation halted: Unit number '${unitNumber}' already exists in this building.`,
            HttpStatus.CONFLICT,
          );
        }

        unitsToCreate.push({
          organizationId,
          communityId,
          sectionId: input.sectionId || (building?.sectionId ?? null),
          buildingId: input.buildingId || null,
          floorId,
          unitNumber,
          displayName: building ? `${building.name} - ${unitNumber}` : unitNumber,
          unitType: (input.unitType || 'APARTMENT') as UnitType,
          status: 'ACTIVE' as UnitStatus,
          carpetArea: input.carpetArea ?? null,
          builtUpArea: input.builtUpArea ?? null,
          superBuiltUpArea: input.superBuiltUpArea ?? null,
          areaUnit: (input.areaUnit || 'SQFT') as AreaUnit,
          bedroomCount: input.bedroomCount ?? null,
          bathroomCount: input.bathroomCount ?? null,
          version: 1,
        });
      }
    }

    // 3. Batch insert
    await this.unitRepo.createMany(unitsToCreate);

    this.logger.log(
      `Bulk created ${unitsToCreate.length} units in community: ${communityId} building: ${input.buildingId || 'standalone'}`,
      'BulkUnitService',
    );

    // 4. Fetch created units for response
    const createdUnits = await this.prisma.unit.findMany({
      where: {
        communityId,
        buildingId: input.buildingId || null,
        unitNumber: { in: unitsToCreate.map((u) => u.unitNumber) },
      },
      include: {
        building: { select: { id: true, name: true, code: true } },
        floor: { select: { id: true, label: true } },
        section: { select: { id: true, name: true, code: true } },
      },
      orderBy: { unitNumber: 'asc' },
    });

    return {
      totalGenerated: createdUnits.length,
      createdUnits: createdUnits.map((u) => toUnitResponseDto(u as unknown as Unit)),
    };
  }

  private async getOrgId(communityId: string): Promise<string> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { organizationId: true },
    });
    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return community.organizationId;
  }
}
