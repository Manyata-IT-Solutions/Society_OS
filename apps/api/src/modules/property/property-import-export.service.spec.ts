import { PropertyImportExportService } from './property-import-export.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { PropertyImportJobRepository } from './property-import-job.repository.js';
import type { SectionRepository } from './section.repository.js';
import type { BuildingRepository } from './building.repository.js';
import type { FloorRepository } from './floor.repository.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';

describe('PropertyImportExportService (Unit)', () => {
  let service: PropertyImportExportService;
  let mockPrisma: Record<string, unknown>;
  let mockImportJobRepo: Record<string, unknown>;
  let mockSectionRepo: Record<string, unknown>;
  let mockBuildingRepo: Record<string, unknown>;
  let mockFloorRepo: Record<string, unknown>;
  let mockEventsService: Record<string, unknown>;
  let mockLogger: Record<string, unknown>;

  beforeEach(() => {
    mockPrisma = {
      community: {
        findUnique: jest.fn().mockResolvedValue({ id: 'comm-1', organizationId: 'org-1' }),
      },
      unit: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mockImportJobRepo = {
      create: jest.fn().mockResolvedValue({ id: 'job-1', status: 'PROCESSING', totalRows: 1 }),
      updateStatus: jest.fn().mockImplementation((id, status, success, failed, errors) => ({
        id,
        organizationId: 'org-1',
        communityId: 'comm-1',
        status,
        totalRows: success + failed,
        successRows: success,
        failedRows: failed,
        errors,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
    mockSectionRepo = { findByCode: jest.fn(), create: jest.fn() };
    mockBuildingRepo = { findByCode: jest.fn(), create: jest.fn() };
    mockFloorRepo = { findByLabel: jest.fn(), create: jest.fn() };
    mockEventsService = { publish: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { log: jest.fn() };

    service = new PropertyImportExportService(
      mockPrisma as unknown as PrismaService,
      mockImportJobRepo as unknown as PropertyImportJobRepository,
      mockSectionRepo as unknown as SectionRepository,
      mockBuildingRepo as unknown as BuildingRepository,
      mockFloorRepo as unknown as FloorRepository,
      mockEventsService as unknown as EventsService,
      mockLogger as unknown as LoggerService,
    );
  });

  describe('validateImportRows', () => {
    it('should validate valid rows successfully', async () => {
      const result = await service.validateImportRows('comm-1', [
        {
          unitNumber: '101',
          buildingCode: 'TWR-A',
          floorLabel: '1',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
        {
          unitNumber: '102',
          buildingCode: 'TWR-A',
          floorLabel: '1',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.validRowsCount).toBe(2);
      expect(result.errorRowsCount).toBe(0);
    });

    it('should detect missing unit number and duplicate unit in CSV', async () => {
      const result = await service.validateImportRows('comm-1', [
        {
          unitNumber: '',
          buildingCode: 'TWR-A',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
        {
          unitNumber: '101',
          buildingCode: 'TWR-A',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
        {
          unitNumber: '101',
          buildingCode: 'TWR-A',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errorRowsCount).toBe(2);
    });

    it('should reject floor label without building code', async () => {
      const result = await service.validateImportRows('comm-1', [
        {
          unitNumber: '101',
          floorLabel: '1',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          areaUnit: 'SQFT',
        },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.field).toBe('floorLabel');
    });
  });

  describe('exportUnitsCsv', () => {
    it('should export units to CSV and sanitize formulas against injection attacks', async () => {
      (mockPrisma['unit'] as { findMany: jest.Mock }).findMany.mockResolvedValue([
        {
          id: 'u-1',
          unitNumber: '=1+1', // Formula injection attempt
          displayName: '@Malicious',
          unitType: 'APARTMENT',
          status: 'ACTIVE',
          building: { code: 'TWR-A', name: 'Tower A' },
          floor: { label: '1' },
          section: null,
          carpetArea: 1200,
          builtUpArea: 1400,
          superBuiltUpArea: 1600,
          areaUnit: 'SQFT',
          bedroomCount: 2,
          bathroomCount: 2,
        },
      ]);

      const csv = await service.exportUnitsCsv('comm-1');

      expect(csv).toContain("'=1+1");
      expect(csv).toContain("'@Malicious");
      expect(csv).toContain('Tower A');
    });
  });
});
