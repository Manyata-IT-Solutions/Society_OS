import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(@Body() dto: any, @Request() req: any) {
    return this.projectService.createProject(dto, req.user?.id);
  }

  @Post('convert-capex/:capexInitiativeId')
  async convertFromCapex(
    @Param('capexInitiativeId') capexInitiativeId: string,
    @Request() req: any,
  ) {
    return this.projectService.convertFromCapex(capexInitiativeId, req.user?.id);
  }

  @Get()
  async getProjects(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: string,
  ) {
    return this.projectService.getProjects({ organizationId, communityId, status });
  }

  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    return this.projectService.getProjectById(id);
  }

  @Post(':id/submit')
  async submitProject(@Param('id') id: string, @Request() req: any) {
    return this.projectService.submitProject(id, req.user?.id);
  }

  @Post(':id/approve')
  async approveProject(@Param('id') id: string, @Request() req: any) {
    return this.projectService.approveProject(id, req.user?.id);
  }
}
