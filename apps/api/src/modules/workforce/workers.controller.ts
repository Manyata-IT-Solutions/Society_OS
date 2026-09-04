import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkerMasterService } from './worker-master.service.js';
import { CreateWorkerDto, UpdateWorkerDto, LinkUserDto } from '@community-os/contracts';

@Controller('workforce/workers')
@UseGuards(AuthGuard)
export class WorkersController {
  constructor(private readonly workerService: WorkerMasterService) {}

  @Post()
  async createWorker(@Body() dto: CreateWorkerDto) {
    return this.workerService.createWorker(dto);
  }

  @Get()
  async getWorkers(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: string,
  ) {
    return this.workerService.getWorkers(organizationId, communityId, status);
  }

  @Get(':id')
  async getWorkerById(@Param('id') id: string) {
    return this.workerService.getWorkerById(id);
  }

  @Put(':id')
  async updateWorker(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workerService.updateWorker(id, dto);
  }

  @Post('link-user')
  async linkUser(@Body() dto: LinkUserDto) {
    return this.workerService.linkUser(dto);
  }

  @Post(':id/offboard')
  async offboardWorker(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.workerService.offboardWorker(id, body?.reason);
  }
}
