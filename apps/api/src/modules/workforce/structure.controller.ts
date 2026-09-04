import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceStructureService } from './workforce-structure.service.js';
import {
  CreateDepartmentDto,
  CreateJobRoleDto,
  CreateSkillDto,
  AssignWorkerSkillDto,
  CreateWorkerCertificationDto,
} from '@community-os/contracts';

@Controller('workforce/structure')
@UseGuards(AuthGuard)
export class StructureController {
  constructor(private readonly structureService: WorkforceStructureService) {}

  @Post('departments')
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.structureService.createDepartment(dto);
  }

  @Get('departments')
  async getDepartments(@Query('organizationId') organizationId: string) {
    return this.structureService.getDepartments(organizationId);
  }

  @Post('job-roles')
  async createJobRole(@Body() dto: CreateJobRoleDto) {
    return this.structureService.createJobRole(dto);
  }

  @Get('job-roles')
  async getJobRoles(@Query('organizationId') organizationId: string) {
    return this.structureService.getJobRoles(organizationId);
  }

  @Post('skills')
  async createSkill(@Body() dto: CreateSkillDto) {
    return this.structureService.createSkill(dto);
  }

  @Get('skills')
  async getSkills(@Query('organizationId') organizationId: string) {
    return this.structureService.getSkills(organizationId);
  }

  @Post('worker-skills')
  async assignWorkerSkill(@Body() dto: AssignWorkerSkillDto, @Req() req: any) {
    return this.structureService.assignWorkerSkill(dto, req.user?.sub || req.user?.id);
  }

  @Post('certifications')
  async createCertification(@Body() dto: CreateWorkerCertificationDto) {
    return this.structureService.createCertification(dto);
  }
}
