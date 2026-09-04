import { Test, TestingModule } from '@nestjs/testing';
import { AssetMeterService } from './asset-meter.service.js';
import { AssetMeterRepository } from './asset-meter.repository.js';
import { AssetRepository } from './asset.repository.js';
import { EventsService } from '../events/events.service.js';
import { BadRequestException } from '@nestjs/common';

describe('AssetMeterService', () => {
  let service: AssetMeterService;
  let repository: Partial<Record<keyof AssetMeterRepository, jest.Mock>>;
  let assetRepo: Partial<Record<keyof AssetRepository, jest.Mock>>;
  let eventsService: Partial<Record<keyof EventsService, jest.Mock>>;

  const mockActor = {
    userId: 'user-001',
    organizationId: 'org-001',
    communityId: 'comm-001',
  } as any;

  beforeEach(async () => {
    repository = {
      createMeter: jest.fn(),
      findMeterById: jest.fn(),
      findMetersByAssetId: jest.fn(),
      addReading: jest.fn(),
      getReadingHistory: jest.fn(),
    };

    assetRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'asset-001', organizationId: 'org-001', communityId: 'comm-001' }),
    };

    eventsService = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetMeterService,
        { provide: AssetMeterRepository, useValue: repository },
        { provide: AssetRepository, useValue: assetRepo },
        { provide: EventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get<AssetMeterService>(AssetMeterService);
  });

  describe('recordReading', () => {
    it('should accept strictly monotonic readings and compute delta', async () => {
      repository.findMeterById!.mockResolvedValue({
        id: 'meter-001',
        assetId: 'asset-001',
        currentReading: 100.0,
        allowsReset: false,
      });

      repository.addReading!.mockResolvedValue({
        id: 'reading-001',
        meterId: 'meter-001',
        reading: 125.0,
        previousReading: 100.0,
        delta: 25.0,
      });

      const res = await service.recordReading('meter-001', { reading: 125.0 }, mockActor);

      expect(repository.addReading).toHaveBeenCalled();
      expect(res.delta).toBe(25.0);
    });

    it('should reject decreasing meter reading unless reset is allowed', async () => {
      repository.findMeterById!.mockResolvedValue({
        id: 'meter-001',
        assetId: 'asset-001',
        currentReading: 100.0,
        allowsReset: false,
      });

      await expect(
        service.recordReading('meter-001', { reading: 90.0, isReset: false }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
