import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '../config/config.service.js';
import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit(): void {
    try {
      this.client = new Redis(this.configService.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) {
            return null; // Stop retrying after 5 attempts
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis client error: ${err.message}`, 'RedisService');
      });

      this.client
        .connect()
        .then(() => {
          this.logger.log('Redis connected successfully', 'RedisService');
        })
        .catch((err) => {
          this.logger.warn(`Redis connection failed: ${err.message}`, 'RedisService');
        });
    } catch (err) {
      this.logger.warn(
        `Failed to initialize Redis client: ${(err as Error).message}`,
        'RedisService',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis disconnected cleanly', 'RedisService');
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // safe fallback
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // safe fallback
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // safe fallback
    }
  }
}
