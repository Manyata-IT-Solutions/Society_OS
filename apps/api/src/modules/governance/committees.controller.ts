import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CommitteeMasterService } from './committee-master.service.js';
import {
  CreateCommitteeDto,
  CreateCommitteeTermDto,
  CreateCommitteePositionDto,
  AssignCommitteeMemberDto,
} from '@community-os/contracts';

@Controller('governance/committees')
@UseGuards(AuthGuard)
export class GovernanceCommitteesController {
  constructor(private readonly committeeService: CommitteeMasterService) {}

  @Post()
  async createCommittee(@Body() dto: CreateCommitteeDto) {
    return this.committeeService.createCommittee(dto);
  }

  @Get()
  async listCommittees(@Query('communityId') communityId: string) {
    return this.committeeService.listCommittees(communityId);
  }

  @Get(':id')
  async getCommitteeById(@Param('id') id: string) {
    return this.committeeService.getCommitteeById(id);
  }

  @Post('terms')
  async createTerm(@Body() dto: CreateCommitteeTermDto) {
    return this.committeeService.createTerm(dto);
  }

  @Post('positions')
  async createPosition(@Body() dto: CreateCommitteePositionDto) {
    return this.committeeService.createPosition(dto);
  }

  @Get('positions/list')
  async listPositions(@Query('organizationId') organizationId: string) {
    return this.committeeService.listPositions(organizationId);
  }

  @Post('memberships')
  async assignMember(@Body() dto: AssignCommitteeMemberDto) {
    return this.committeeService.assignMember(dto);
  }
}
