import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CertificationService } from './certification.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('progress-certificates')
@UseGuards(AuthGuard)
export class CertificationController {
  constructor(private readonly certService: CertificationService) {}

  @Post()
  async createCertificate(@Body() dto: any, @Request() req: any) {
    return this.certService.createCertificate(dto, req.user?.id);
  }

  @Get()
  async getCertificates(
    @Query('projectId') projectId: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.certService.getCertificates(projectId, vendorId);
  }

  @Post(':id/approve')
  async approveCertificate(@Param('id') id: string, @Request() req: any) {
    return this.certService.approveCertificate(id, req.user?.id);
  }
}
