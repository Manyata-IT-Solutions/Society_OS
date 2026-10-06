import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkPackageService } from './work-package.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('work-packages')
@UseGuards(AuthGuard)
export class WorkPackageController {
  constructor(private readonly wpService: WorkPackageService) {}

  @Post()
  async createWorkPackage(@Body() dto: any) {
    return this.wpService.createWorkPackage(dto);
  }

  @Get()
  async getWorkPackages(@Query('projectId') projectId: string) {
    return this.wpService.getWorkPackages(projectId);
  }

  @Get(':id')
  async getWorkPackageById(@Param('id') id: string) {
    return this.wpService.getWorkPackageById(id);
  }
}
