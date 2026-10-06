import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MeasurementService } from './measurement.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('measurements')
@UseGuards(AuthGuard)
export class MeasurementController {
  constructor(private readonly measService: MeasurementService) {}

  @Post()
  async submitMeasurement(@Body() dto: any, @Request() req: any) {
    return this.measService.submitMeasurement(dto, req.user?.id);
  }

  @Get()
  async getMeasurements(
    @Query('projectId') projectId: string,
    @Query('workPackageId') workPackageId?: string,
  ) {
    return this.measService.getMeasurements(projectId, workPackageId);
  }

  @Post('verify')
  async verifyMeasurement(@Body() dto: any, @Request() req: any) {
    return this.measService.verifyMeasurement(dto, req.user?.id);
  }
}
