import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@community-os/database';
import { ConfigService } from '../config/config.service.js';
import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const url = configService?.databaseUrl;
    super({
      ...(url ? { datasources: { db: { url } } } : {}),
      log: configService?.isDevelopment
        ? [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL database connected successfully', 'PrismaService');
    } catch (error) {
      this.logger.error(
        `Failed to connect to PostgreSQL database: ${(error as Error).message}`,
        (error as Error).stack,
        'PrismaService',
      );
      // Let readiness probes reflect database status rather than crashing immediately in dev
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('PostgreSQL database disconnected cleanly', 'PrismaService');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
