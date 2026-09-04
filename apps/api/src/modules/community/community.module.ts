import { Module } from '@nestjs/common';
import { CommunitiesController } from './community.controller.js';
import { CommunityService } from './community.service.js';
import { CommunityRepository } from './community.repository.js';
import { OrganizationModule } from '../organization/organization.module.js';

@Module({
  imports: [OrganizationModule],
  controllers: [CommunitiesController],
  providers: [CommunityService, CommunityRepository],
  exports: [CommunityService, CommunityRepository],
})
export class CommunityModule {}
