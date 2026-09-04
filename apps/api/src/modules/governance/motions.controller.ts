import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceMotionService } from './governance-motion.service.js';
import { ProposeMotionDto, AmendMotionDto } from '@community-os/contracts';

@Controller('governance/motions')
@UseGuards(AuthGuard)
export class GovernanceMotionsController {
  constructor(private readonly motionService: GovernanceMotionService) {}

  @Post()
  async proposeMotion(@Body() dto: ProposeMotionDto) {
    return this.motionService.proposeMotion(dto);
  }

  @Post('amend')
  async amendMotion(@Body() dto: AmendMotionDto) {
    return this.motionService.amendMotion(dto);
  }
}
