import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceLeaveOvertimeService } from './workforce-leave-overtime.service.js';
import {
  CreateLeaveRequestDto,
  DecideLeaveRequestDto,
  CreateOvertimeRecordDto,
} from '@community-os/contracts';

@Controller('workforce/leave-overtime')
@UseGuards(AuthGuard)
export class LeaveOvertimeController {
  constructor(private readonly leaveService: WorkforceLeaveOvertimeService) {}

  @Post('leave')
  async createLeaveRequest(
    @Body() dto: CreateLeaveRequestDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.leaveService.createLeaveRequest(dto, organizationId);
  }

  @Post('leave/decide')
  async decideLeaveRequest(@Body() dto: DecideLeaveRequestDto, @Req() req: any) {
    return this.leaveService.decideLeaveRequest(dto, req.user?.sub || req.user?.id);
  }

  @Get('leave')
  async getLeaveRequests(
    @Query('organizationId') organizationId: string,
    @Query('workerId') workerId?: string,
  ) {
    return this.leaveService.getLeaveRequests(organizationId, workerId);
  }

  @Post('overtime')
  async recordOvertime(
    @Body() dto: CreateOvertimeRecordDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.leaveService.recordOvertime(dto, organizationId);
  }

  @Get('overtime')
  async getOvertimeRecords(@Query('organizationId') organizationId: string) {
    return this.leaveService.getOvertimeRecords(organizationId);
  }
}
