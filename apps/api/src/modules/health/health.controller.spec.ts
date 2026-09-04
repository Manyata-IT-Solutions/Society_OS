import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { ConfigService } from '../config/config.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { Response } from 'express';

describe('HealthController', () => {
  let controller: HealthController;
  let _healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            appName: 'CommunityOS',
            appVersion: '0.1.0',
          },
        },
        {
          provide: PrismaService,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: RedisService,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    _healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(_healthService).toBeDefined();
  });

  it('should return health status', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('healthy');
    expect(result.appName).toBe('CommunityOS');
    expect(result.version).toBe('0.1.0');
    expect(result.timestamp).toBeDefined();
  });

  it('should return liveness status', () => {
    const result = controller.getLiveness();
    expect(result.status).toBe('alive');
    expect(result.timestamp).toBeDefined();
  });

  it('should return readiness status', async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const result = await controller.getReadiness(mockRes);
    expect(result.status).toBe('healthy');
    expect(result.dependencies.database.status).toBe('up');
    expect(result.dependencies.redis.status).toBe('up');
  });
});
