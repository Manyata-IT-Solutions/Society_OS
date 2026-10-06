import { BulkUnitService } from './bulk-unit.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { BuildingRepository } from './building.repository.js';
import type { FloorRepository } from './floor.repository.js';
import type { UnitRepository } from './unit.repository.js';
import type { PropertyHierarchyService } from './property-hierarchy.service.js';
import type { LoggerService } from '../logger/logger.service.js';

describe('BulkUnitService (Unit)', () => {
  let service: BulkUnitService;
  let mockPrisma: Record<string, unknown>;
  let mockBuildingRepo: Record<string, unknown>;
  let mockFloorRepo: Record<string, unknown>;
  let mockUnitRepo: Record<string, unknown>;
  let mockHierarchyService: Record<string, unknown>;
  let mockLogger: Record<string, unknown>;

  beforeEach(() => {
    mockPrisma = {
      unit: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    mockBuildingRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'bldg-1',
        organizationId: 'org-1',
        communityId: 'comm-1',
        name: 'Tower A',
      }),
    };
    mockFloorRepo = {
      findByLabel: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((_orgId, _commId, _bldgId, input) => ({
        id: `floor-${input.label}`,
        label: input.label,
      })),
    };
    mockUnitRepo = {
      createMany: jest.fn().mockResolvedValue(4),
    };
    mockHierarchyService = {
      validateParentConsistency: jest.fn().mockResolvedValue(undefined),
    };
    mockLogger = {
      log: jest.fn(),
    };

    service = new BulkUnitService(
      mockPrisma as unknown as PrismaService,
      mockBuildingRepo as unknown as BuildingRepository,
      mockFloorRepo as unknown as FloorRepository,
      mockUnitRepo as unknown as UnitRepository,
      mockHierarchyService as unknown as PropertyHierarchyService,
      mockLogger as unknown as LoggerService,
    );
  });

  it('should generate units correctly across multiple floors using suffix patterns', async () => {
    (mockPrisma['unit'] as { findMany: jest.Mock }).findMany
      .mockResolvedValueOnce([]) // First call for pre-check
      .mockResolvedValueOnce([
        // Second call for result return
        {
          id: 'u-101',
          unitNumber: '101',
          displayName: 'Tower A - 101',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'u-102',
          unitNumber: '102',
          displayName: 'Tower A - 102',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'u-201',
          unitNumber: '201',
          displayName: 'Tower A - 201',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'u-202',
          unitNumber: '202',
          displayName: 'Tower A - 202',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

    const result = await service.generateBulkUnits('comm-1', {
      buildingId: 'bldg-1',
      floors: [
        { floorLabel: '1', levelNumber: 1 },
        { floorLabel: '2', levelNumber: 2 },
      ],
      unitSuffixes: ['01', '02'],
      unitType: 'APARTMENT',
      carpetArea: 1200,
      areaUnit: 'SQFT',
    });

    expect(result.totalGenerated).toBe(4);
    expect(mockUnitRepo['createMany'] as jest.Mock).toHaveBeenCalledTimes(1);
    expect(mockFloorRepo['create'] as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it('should abort bulk generation when duplicate unit number already exists', async () => {
    (mockPrisma['unit'] as { findMany: jest.Mock }).findMany.mockResolvedValue([
      { unitNumber: '101' },
    ]);

    await expect(
      service.generateBulkUnits('comm-1', {
        buildingId: 'bldg-1',
        floors: [{ floorLabel: '1', levelNumber: 1 }],
        unitSuffixes: ['01', '02'],
        unitType: 'APARTMENT',
        areaUnit: 'SQFT',
      }),
    ).rejects.toThrow(DomainException);
  });
});
