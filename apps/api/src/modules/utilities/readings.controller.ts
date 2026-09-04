import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { MeterReadingService } from './meter-reading.service.js';
import {
  RecordMeterReadingDto,
  CorrectMeterReadingDto,
  EstimateMeterReadingDto,
} from '@community-os/contracts';

@Controller('utilities/readings')
@UseGuards(AuthGuard)
export class UtilityReadingsController {
  constructor(private readonly readingService: MeterReadingService) {}

  @Post()
  async recordReading(@Body() dto: RecordMeterReadingDto, @Req() req: any) {
    return this.readingService.recordReading(dto, req?.user?.id);
  }

  @Post('correct')
  async correctReading(@Body() dto: CorrectMeterReadingDto, @Req() req: any) {
    return this.readingService.correctReading(dto, req?.user?.id);
  }

  @Post('estimate')
  async estimateReading(@Body() dto: EstimateMeterReadingDto, @Req() req: any) {
    return this.readingService.estimateReading(dto, req?.user?.id);
  }
}
