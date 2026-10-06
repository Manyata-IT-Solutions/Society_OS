import { Module } from '@nestjs/common';
import { FeatureOverrideRepository } from './feature-override.repository.js';
import { FeatureResolverService } from './feature-resolver.service.js';
import { FeatureFlagService } from './feature-flag.service.js';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureOverrideRepository, FeatureResolverService, FeatureFlagService],
  exports: [FeatureOverrideRepository, FeatureResolverService, FeatureFlagService],
})
export class FeatureFlagModule {}
