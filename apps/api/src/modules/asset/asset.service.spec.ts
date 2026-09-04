import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service.js';
import { AssetRepository } from './asset.repository.js';
import { AssetCategoryRepository } from './asset-category.repository.js';
import { AssetModelRepository } from './asset-model.repository.js';
import { AssetSequenceService } from './asset-sequence.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotFoundException } from '@nestjs/common';

describe('AssetService', () => {
  let service: AssetService;
  let repository: Partial<Record<keyof AssetRepository, jest.Mock>>;
  let categoryRepo: Partial<Record<keyof AssetCategoryRepository, jest.Mock>>;
  let modelRepo: Partial<Record<keyof AssetModelRepository, jest.Mock>>;
  let sequenceService: Partial<Record<keyof AssetSequenceService, jest.Mock>>;
  let eventsService: Partial<Record<keyof EventsService, jest.Mock>>;
  let auditService: Partial<Record<keyof AuditService, jest.Mock>>;

  const mockActor = {
    userId: 'user-001',
    organizationId: 'org-001',
    communityId: 'comm-001',
    roles: ['ADMIN'],
    permissions: ['asset:view', 'asset:create'],
  } as any;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      recordLocationMove: jest.fn(),
      getLocationHistory: jest.fn(),
      recordDowntime: jest.fn(),
      closeDowntime: jest.fn(),
      getServiceHistory: jest.fn(),
    };

    categoryRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'cat-001', name: 'Electrical' }),
    };

    modelRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'model-001', modelName: 'Cummins DG' }),
    };

    sequenceService = {
      nextAssetCode: jest.fn().mockResolvedValue('AST-2026-000001'),
    };

    eventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: AssetRepository, useValue: repository },
        { provide: AssetCategoryRepository, useValue: categoryRepo },
        { provide: AssetModelRepository, useValue: modelRepo },
        { provide: AssetSequenceService, useValue: sequenceService },
        { provide: EventsService, useValue: eventsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAsset', () => {
    it('should generate sequence code and opaque QR token upon creation', async () => {
      const input = {
        organizationId: 'org-001',
        communityId: 'comm-001',
        name: 'Diesel Generator 01',
        assetCategoryId: 'cat-001',
        criticality: 'CRITICAL',
        condition: 'GOOD',
      } as any;

      repository.create!.mockResolvedValue({
        id: 'asset-001',
        assetCode: 'AST-2026-000001',
        qrIdentifier: 'ast_qr_mock123',
        ...input,
      });

      const result = await service.createAsset(input, mockActor);

      expect(sequenceService.nextAssetCode).toHaveBeenCalledWith('org-001', 'comm-001', 'AST');
      expect(repository.create).toHaveBeenCalled();
      expect(eventsService.publish).toHaveBeenCalled();
      expect(result.id).toBe('asset-001');
    });
  });

  describe('getAssetById', () => {
    it('should throw NotFoundException if asset does not exist', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(service.getAssetById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
