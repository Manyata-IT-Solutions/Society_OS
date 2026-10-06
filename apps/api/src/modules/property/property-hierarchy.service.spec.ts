import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { PrismaService } from '../database/prisma.service.js';

interface MockPrisma {
  community: { findUnique: jest.Mock };
  communitySection: { findFirst: jest.Mock; findUnique: jest.Mock };
  building: { findFirst: jest.Mock; findUnique: jest.Mock };
  floor: { findFirst: jest.Mock; findUnique: jest.Mock };
}

describe('PropertyHierarchyService (Unit)', () => {
  let service: PropertyHierarchyService;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = {
      community: {
        findUnique: jest.fn(),
      },
      communitySection: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      building: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      floor: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new PropertyHierarchyService(mockPrisma as unknown as PrismaService);
  });

  describe('getPropertyTree', () => {
    it('should assemble a complete structured property tree', async () => {
      mockPrisma.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        name: 'Green Valley',
        code: 'GVT-01',
        status: 'ACTIVE',
        sections: [
          {
            id: 'sec-1',
            name: 'Phase 1',
            code: 'SEC-1',
            status: 'ACTIVE',
            buildings: [
              {
                id: 'bldg-1',
                name: 'Tower A',
                code: 'TWR-A',
                status: 'ACTIVE',
                floors: [
                  {
                    id: 'floor-1',
                    label: '1',
                    status: 'ACTIVE',
                    units: [
                      {
                        id: 'unit-101',
                        unitNumber: '101',
                        displayName: '101 (3BHK)',
                        status: 'ACTIVE',
                      },
                    ],
                  },
                ],
                units: [],
              },
            ],
            units: [],
          },
        ],
        buildings: [],
        units: [],
      });

      const tree = await service.getPropertyTree('comm-1');

      expect(tree.id).toBe('comm-1');
      expect(tree.type).toBe('COMMUNITY');
      expect(tree.children).toHaveLength(1);
      expect(tree.children![0]!.type).toBe('SECTION');
      expect(tree.children![0]!.children).toHaveLength(1);
      expect(tree.children![0]!.children![0]!.type).toBe('BUILDING');
      expect(tree.children![0]!.children![0]!.children![0]!.type).toBe('FLOOR');
      expect(tree.children![0]!.children![0]!.children![0]!.children![0]!.type).toBe('UNIT');
    });

    it('should throw DomainException if community is not found', async () => {
      mockPrisma.community.findUnique.mockResolvedValue(null);

      await expect(service.getPropertyTree('non-existent')).rejects.toThrow(DomainException);
    });
  });

  describe('validateParentConsistency', () => {
    it('should pass when section, building, and floor match community hierarchy', async () => {
      mockPrisma.communitySection.findFirst.mockResolvedValue({
        id: 'sec-1',
        communityId: 'comm-1',
      });
      mockPrisma.building.findFirst.mockResolvedValue({
        id: 'bldg-1',
        communityId: 'comm-1',
        sectionId: 'sec-1',
      });
      mockPrisma.floor.findFirst.mockResolvedValue({
        id: 'floor-1',
        buildingId: 'bldg-1',
        communityId: 'comm-1',
      });

      await expect(
        service.validateParentConsistency('comm-1', 'sec-1', 'bldg-1', 'floor-1'),
      ).resolves.not.toThrow();
    });

    it('should throw DomainException if section does not belong to community', async () => {
      mockPrisma.communitySection.findFirst.mockResolvedValue(null);

      await expect(service.validateParentConsistency('comm-1', 'wrong-section')).rejects.toThrow(
        DomainException,
      );
    });

    it('should throw DomainException if floor is specified without building', async () => {
      await expect(
        service.validateParentConsistency('comm-1', null, null, 'floor-1'),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('generateUnitPath', () => {
    it('should generate human readable path across all hierarchy levels', async () => {
      mockPrisma.community.findUnique.mockResolvedValue({ name: 'Green Valley' });
      mockPrisma.communitySection.findUnique.mockResolvedValue({ name: 'Phase 1' });
      mockPrisma.building.findUnique.mockResolvedValue({ name: 'Tower A' });
      mockPrisma.floor.findUnique.mockResolvedValue({ label: '3' });

      const path = await service.generateUnitPath({
        communityId: 'comm-1',
        sectionId: 'sec-1',
        buildingId: 'bldg-1',
        floorId: 'floor-3',
        unitNumber: '301',
      });

      expect(path).toBe('Green Valley / Phase 1 / Tower A / Floor 3 / 301');
    });
  });
});
