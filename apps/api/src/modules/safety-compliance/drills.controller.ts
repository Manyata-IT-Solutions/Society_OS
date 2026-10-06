import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SafetyDrillService } from './safety-drill.service.js';
import { PlanSafetyDrillDto, CompleteSafetyDrillDto } from '@community-os/contracts';

@Controller('safety/drills')
@UseGuards(AuthGuard)
export class SafetyDrillsController {
  constructor(private readonly drillService: SafetyDrillService) {}

  @Post('plan')
  async planDrill(@Body() dto: PlanSafetyDrillDto) {
    return this.drillService.planDrill(dto);
  }

  @Post('complete')
  async completeDrill(@Body() dto: CompleteSafetyDrillDto) {
    return this.drillService.completeDrill(dto);
  }
}
