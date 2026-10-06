import { Module } from '@nestjs/common';
import { ConfigurationRepository } from './configuration.repository.js';
import { ConfigurationResolverService } from './configuration-resolver.service.js';
import { ConfigurationService } from './configuration.service.js';
import { ConfigurationController } from './configuration.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';

@Module({
  imports: [DatabaseModule, RedisModule, EventsModule, LoggerModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationRepository, ConfigurationResolverService, ConfigurationService],
  exports: [ConfigurationRepository, ConfigurationResolverService, ConfigurationService],
})
export class ConfigurationModule {}
