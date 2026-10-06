import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceDeploymentService } from './workforce-deployment.service.js';
import { CreateDeploymentDto } from '@community-os/contracts';

@Controller('workforce/deployments')
@UseGuards(AuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentService: WorkforceDeploymentService) {}

  @Post()
  async createDeployment(@Body() dto: CreateDeploymentDto) {
    return this.deploymentService.createDeployment(dto);
  }

  @Get()
  async getDeployments(
    @Query('communityId') communityId: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.deploymentService.getDeployments(communityId, targetType);
  }
}
