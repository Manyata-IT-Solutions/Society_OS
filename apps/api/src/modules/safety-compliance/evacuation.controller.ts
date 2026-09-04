import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { EvacuationService } from './evacuation.service.js';
import { CreateEvacuationPlanDto, OrderEvacuationDto } from '@community-os/contracts';

@Controller('safety/evacuation')
@UseGuards(AuthGuard)
export class EvacuationController {
  constructor(private readonly evacService: EvacuationService) {}

  @Post('plans')
  async createPlan(@Body() dto: CreateEvacuationPlanDto) {
    return this.evacService.createPlan(dto);
  }

  @Post('order')
  async orderEvacuation(@Body() dto: OrderEvacuationDto, @Req() req: any) {
    return this.evacService.orderEvacuation(dto, req?.user?.id);
  }
}
