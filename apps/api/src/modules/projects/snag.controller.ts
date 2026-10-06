import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { QualitySnagService } from './quality-snag.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('project-snags')
@UseGuards(AuthGuard)
export class SnagController {
  constructor(private readonly snagService: QualitySnagService) {}

  @Post()
  async createSnag(@Body() dto: any, @Request() req: any) {
    return this.snagService.createSnag(dto, req.user?.id);
  }

  @Get()
  async getSnags(@Query('projectId') projectId: string) {
    return this.snagService.getSnags(projectId);
  }

  @Post(':id/resolve')
  async resolveSnag(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.snagService.resolveSnag(id, body.resolutionEvidenceDocId, req.user?.id);
  }
}
