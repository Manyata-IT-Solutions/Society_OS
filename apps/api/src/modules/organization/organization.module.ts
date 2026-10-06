import { Module } from '@nestjs/common';
import { OrganizationsController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { OrganizationRepository } from './organization.repository.js';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository],
})
export class OrganizationModule {}
