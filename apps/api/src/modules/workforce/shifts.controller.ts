import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceShiftService } from './workforce-shift.service.js';
import { CreateShiftTemplateDto, GenerateShiftInstancesDto } from '@community-os/contracts';

@Controller('workforce/shifts')
@UseGuards(AuthGuard)
export class ShiftsController {
  constructor(private readonly shiftService: WorkforceShiftService) {}

  @Post('templates')
  async createTemplate(@Body() dto: CreateShiftTemplateDto) {
    return this.shiftService.createTemplate(dto);
  }

  @Get('templates')
  async getTemplates(@Query('organizationId') organizationId: string) {
    return this.shiftService.getTemplates(organizationId);
  }

  @Post('generate-instances')
  async generateShiftInstances(@Body() dto: GenerateShiftInstancesDto) {
    return this.shiftService.generateShiftInstances(dto);
  }

  @Get('instances')
  async getShiftInstances(
    @Query('communityId') communityId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftService.getShiftInstances(communityId, startDate, endDate);
  }
}
