import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type {
  HealthCheckResponse,
  ReadinessResponse,
  LivenessResponse,
} from '@community-os/contracts';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  getHealth(): HealthCheckResponse {
    return {
      status: 'healthy',
      appName: this.configService.appName,
      version: this.configService.appVersion,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  getLiveness(): LivenessResponse {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const startDb = Date.now();
    const isDbHealthy = await this.prismaService.isHealthy();
    const dbLatency = Date.now() - startDb;

    const startRedis = Date.now();
    const isRedisHealthy = await this.redisService.isHealthy();
    const redisLatency = Date.now() - startRedis;

    const isAllHealthy = isDbHealthy && isRedisHealthy;
    const isPartial = isDbHealthy || isRedisHealthy;

    return {
      status: isAllHealthy ? 'healthy' : isPartial ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: isDbHealthy ? 'up' : 'down',
          latencyMs: dbLatency,
          message: isDbHealthy ? undefined : 'Database query probe failed',
        },
        redis: {
          status: isRedisHealthy ? 'up' : 'down',
          latencyMs: redisLatency,
          message: isRedisHealthy ? undefined : 'Redis ping probe failed',
        },
      },
    };
  }
}
