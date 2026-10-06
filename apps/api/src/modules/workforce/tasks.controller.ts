import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceTaskService } from './workforce-task.service.js';
import { CreateWorkforceTaskDto } from '@community-os/contracts';

@Controller('workforce/tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly taskService: WorkforceTaskService) {}

  @Post()
  async createTask(@Body() dto: CreateWorkforceTaskDto) {
    return this.taskService.createTask(dto);
  }

  @Post(':id/complete')
  async completeTask(@Param('id') id: string) {
    return this.taskService.completeTask(id);
  }

  @Get()
  async getTasks(@Query('communityId') communityId: string, @Query('status') status?: string) {
    return this.taskService.getTasks(communityId, status);
  }
}
