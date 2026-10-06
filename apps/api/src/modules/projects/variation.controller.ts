import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProjectVariationService } from './project-variation.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('project-variations')
@UseGuards(AuthGuard)
export class VariationController {
  constructor(private readonly varService: ProjectVariationService) {}

  @Post()
  async createVariation(@Body() dto: any, @Request() req: any) {
    return this.varService.createVariation(dto, req.user?.id);
  }

  @Get()
  async getVariations(@Query('projectId') projectId: string) {
    return this.varService.getVariations(projectId);
  }

  @Post(':id/approve')
  async approveVariation(@Param('id') id: string, @Request() req: any) {
    return this.varService.approveVariation(id, req.user?.id);
  }
}
