import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SafetyPermitService } from './safety-permit.service.js';
import { CreateSafetyPermitDto, ApproveSafetyPermitDto } from '@community-os/contracts';

@Controller('safety/permits')
@UseGuards(AuthGuard)
export class SafetyPermitsController {
  constructor(private readonly permitService: SafetyPermitService) {}

  @Post()
  async createPermit(@Body() dto: CreateSafetyPermitDto) {
    return this.permitService.createPermit(dto);
  }

  @Post('approve')
  async approvePermit(@Body() dto: ApproveSafetyPermitDto, @Req() req: any) {
    return this.permitService.approvePermit(dto, req?.user?.id);
  }
}
