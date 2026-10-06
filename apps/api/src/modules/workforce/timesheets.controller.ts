import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceTimesheetService } from './workforce-timesheet.service.js';
import { CreateTimesheetEntryDto } from '@community-os/contracts';

@Controller('workforce/timesheets')
@UseGuards(AuthGuard)
export class TimesheetsController {
  constructor(private readonly timesheetService: WorkforceTimesheetService) {}

  @Post()
  async logTimesheet(
    @Body() dto: CreateTimesheetEntryDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.timesheetService.logTimesheet(dto, organizationId);
  }

  @Get()
  async getTimesheets(
    @Query('workerId') workerId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.timesheetService.getTimesheets(workerId, organizationId);
  }
}
