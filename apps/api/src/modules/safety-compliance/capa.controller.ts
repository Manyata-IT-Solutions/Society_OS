import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SafetyCAPAService } from './safety-capa.service.js';
import {
  CreateSafetyCorrectiveActionDto,
  VerifyCorrectiveActionDto,
} from '@community-os/contracts';

@Controller('safety/capa')
@UseGuards(AuthGuard)
export class SafetyCAPAController {
  constructor(private readonly capaService: SafetyCAPAService) {}

  @Post()
  async createCAPA(@Body() dto: CreateSafetyCorrectiveActionDto) {
    return this.capaService.createCAPA(dto);
  }

  @Post('verify')
  async verifyCAPA(@Body() dto: VerifyCorrectiveActionDto, @Req() req: any) {
    return this.capaService.verifyCAPA(dto, req?.user?.id);
  }

  @Get()
  async listCAPA(@Query('status') status?: string) {
    return this.capaService.listCAPA(status);
  }
}
