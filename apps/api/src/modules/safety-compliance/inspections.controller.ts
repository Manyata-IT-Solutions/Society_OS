import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SafetyInspectionService } from './safety-inspection.service.js';
import { CreateSafetyInspectionDto, RecordInspectionFindingDto } from '@community-os/contracts';

@Controller('safety/inspections')
@UseGuards(AuthGuard)
export class SafetyInspectionsController {
  constructor(private readonly inspService: SafetyInspectionService) {}

  @Post()
  async createInspection(@Body() dto: CreateSafetyInspectionDto) {
    return this.inspService.createInspection(dto);
  }

  @Post('findings')
  async recordFinding(@Body() dto: RecordInspectionFindingDto) {
    return this.inspService.recordFinding(dto);
  }
}
