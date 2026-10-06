import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkflowService } from './workflow.service.js';
import { WorkflowRegistry } from './workflow-registry.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateWorkflowDefinitionSchema,
  UpdateWorkflowDefinitionSchema,
  StartWorkflowInstanceSchema,
  TransitionWorkflowSchema,
  OverrideWorkflowSchema,
} from '@community-os/validation';
import {
  toWorkflowDefinitionDto,
  toWorkflowInstanceDto,
  toWorkflowTransitionHistoryDto,
  toAllowedWorkflowActionDto,
  type WorkflowDefinitionResponseDto,
  type WorkflowInstanceResponseDto,
  type AllowedWorkflowActionDto,
} from '@community-os/contracts';

@Controller('workflows')
@UseGuards(AuthGuard, PermissionGuard)
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly registry: WorkflowRegistry,
  ) {}

  @Get('definitions')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_VIEW)
  async listDefinitions(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('entityType') entityType?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: WorkflowDefinitionResponseDto[]; total: number }> {
    const res = await this.workflowService.listDefinitions({
      organizationId,
      communityId,
      entityType,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map(toWorkflowDefinitionDto),
      total: res.total,
    };
  }

  @Get('definitions/:id')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_VIEW)
  async getDefinition(@Param('id') id: string): Promise<WorkflowDefinitionResponseDto> {
    const def = await this.workflowService.getDefinitionById(id);
    return toWorkflowDefinitionDto(def);
  }

  @Post('definitions')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createDefinition(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkflowDefinitionResponseDto> {
    const parsed = CreateWorkflowDefinitionSchema.parse(body);
    const created = await this.workflowService.createDefinitionDraft(
      parsed as unknown as Parameters<typeof this.workflowService.createDefinitionDraft>[0],
      actor,
    );
    return toWorkflowDefinitionDto(created);
  }

  @Put('definitions/:id')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_MANAGE)
  async updateDefinition(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkflowDefinitionResponseDto> {
    const parsed = UpdateWorkflowDefinitionSchema.parse(body);
    const updated = await this.workflowService.updateDefinitionDraft(
      id,
      parsed as unknown as Parameters<typeof this.workflowService.updateDefinitionDraft>[1],
      actor,
    );
    return toWorkflowDefinitionDto(updated);
  }

  @Post('definitions/:id/publish')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_PUBLISH)
  @HttpCode(HttpStatus.OK)
  async publishDefinition(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkflowDefinitionResponseDto> {
    const published = await this.workflowService.publishDefinition(id, actor);
    return toWorkflowDefinitionDto(published);
  }

  @Post('definitions/:id/clone')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async cloneDefinition(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkflowDefinitionResponseDto> {
    const cloned = await this.workflowService.cloneDefinitionVersion(id, actor);
    return toWorkflowDefinitionDto(cloned);
  }

  @Get('resources/types')
  @RequirePermission(PERMISSIONS.WORKFLOW_DEFINITION_VIEW)
  async listResourceTypes() {
    return {
      items: this.registry.listResourceTypes(),
    };
  }

  @Get('instances')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_VIEW)
  async listInstances(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('status') status?: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED',
    @Query('workflowDefinitionKey') workflowDefinitionKey?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: WorkflowInstanceResponseDto[]; total: number }> {
    const res = await this.workflowService.listInstances({
      organizationId,
      communityId,
      resourceType,
      resourceId,
      status,
      workflowDefinitionKey,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map(toWorkflowInstanceDto),
      total: res.total,
    };
  }

  @Get('instances/:id')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_VIEW)
  async getInstance(@Param('id') id: string) {
    const inst = await this.workflowService.getInstanceById(id);
    return {
      ...toWorkflowInstanceDto(inst),
      history: inst.history.map(toWorkflowTransitionHistoryDto),
    };
  }

  @Post('instances')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_TRANSITION)
  @HttpCode(HttpStatus.CREATED)
  async startInstance(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
    @Req() req: Request,
  ): Promise<WorkflowInstanceResponseDto> {
    const parsed = StartWorkflowInstanceSchema.parse(body);
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || undefined;

    const started = await this.workflowService.startInstance({
      ...parsed,
      actor,
      requestId,
      correlationId,
    });

    return toWorkflowInstanceDto(started);
  }

  @Get('instances/:id/actions')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_VIEW)
  async getAllowedActions(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: AllowedWorkflowActionDto[] }> {
    const actions = await this.workflowService.getAllowedActions(id, actor);
    return {
      items: actions.map(toAllowedWorkflowActionDto),
    };
  }

  @Post('instances/:id/transition')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_TRANSITION)
  @HttpCode(HttpStatus.OK)
  async transitionInstance(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
    @Req() req: Request,
  ): Promise<WorkflowInstanceResponseDto> {
    const parsed = TransitionWorkflowSchema.parse(body);
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || undefined;

    const updated = await this.workflowService.transition({
      instanceId: id,
      action: parsed.action,
      reason: parsed.reason,
      comment: parsed.comment,
      expectedVersion: parsed.expectedVersion,
      context: parsed.context,
      actor,
      requestId,
      correlationId,
    });

    return toWorkflowInstanceDto(updated);
  }

  @Post('instances/:id/override')
  @RequirePermission(PERMISSIONS.WORKFLOW_INSTANCE_OVERRIDE)
  @HttpCode(HttpStatus.OK)
  async overrideInstance(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
    @Req() req: Request,
  ): Promise<WorkflowInstanceResponseDto> {
    const parsed = OverrideWorkflowSchema.parse(body);
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || undefined;

    const updated = await this.workflowService.manualOverride({
      instanceId: id,
      targetState: parsed.targetState,
      reason: parsed.reason,
      comment: parsed.comment,
      expectedVersion: parsed.expectedVersion,
      actor,
      requestId,
      correlationId,
    });

    return toWorkflowInstanceDto(updated);
  }
}
