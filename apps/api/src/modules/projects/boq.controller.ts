import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BoqService } from './boq.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('boq')
@UseGuards(AuthGuard)
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  @Post()
  async createBoq(@Body() dto: any, @Request() req: any) {
    return this.boqService.createBoq(dto, req.user?.id);
  }

  @Get()
  async getBoqs(@Query('projectId') projectId: string) {
    return this.boqService.getBoqs(projectId);
  }

  @Get(':id')
  async getBoqById(@Param('id') id: string) {
    return this.boqService.getBoqById(id);
  }

  @Post(':id/approve')
  async approveBoq(@Param('id') id: string, @Request() req: any) {
    return this.boqService.approveBoq(id, req.user?.id);
  }

  @Post('revise')
  async reviseBoq(@Body() dto: any, @Request() req: any) {
    return this.boqService.reviseBoq(dto, req.user?.id);
  }
}
