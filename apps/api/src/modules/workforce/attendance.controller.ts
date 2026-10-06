import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceAttendanceService } from './workforce-attendance.service.js';
import { RecordAttendanceDto } from '@community-os/contracts';

@Controller('workforce/attendance')
@UseGuards(AuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: WorkforceAttendanceService) {}

  @Post('check-in')
  async checkIn(@Body() dto: RecordAttendanceDto) {
    return this.attendanceService.checkIn(dto);
  }

  @Post('sessions/:id/check-out')
  async checkOut(@Param('id') id: string, @Body() dto: Partial<RecordAttendanceDto>) {
    return this.attendanceService.checkOut(id, dto);
  }

  @Get()
  async getAttendance(@Query('communityId') communityId: string, @Query('date') date?: string) {
    return this.attendanceService.getAttendance(communityId, date);
  }

  @Post('missing-checkouts/process')
  async processMissingCheckouts(@Query('communityId') communityId: string) {
    return this.attendanceService.processMissingCheckouts(communityId);
  }
}
