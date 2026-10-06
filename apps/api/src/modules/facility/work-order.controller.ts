import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { WorkOrderService } from './work-order.service.js';
import { WorkOrderWithRelations } from './work-order.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type {
  Actor,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderSource,
  FacilityKpiMetrics,
} from '@community-os/types';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  assignWorkOrderSchema,
  blockWorkOrderSchema,
  completeWorkOrderSchema,
  supervisorReviewSchema,
  createWorkOrderTaskSchema,
  updateWorkOrderTaskSchema,
  submitChecklistResultSchema,
  startWorkLogTimerSchema,
  stopWorkLogTimerSchema,
  createManualWorkLogSchema,
  attachWorkOrderEvidenceSchema,
} from '@community-os/validation';
import {
  toWorkOrderDetailDto,
  toWorkOrderSummaryDto,
  toWorkOrderTaskDto,
  toWorkOrderChecklistResultDto,
  toWorkLogDto,
  toWorkOrderEvidenceDto,
  WorkOrderDetailResponseDto,
  WorkOrderSummaryResponseDto,
  WorkOrderTaskResponseDto,
  WorkOrderChecklistResultResponseDto,
  WorkLogResponseDto,
  WorkOrderEvidenceResponseDto,
} from '@community-os/contracts';

@Controller('facility/work-orders')
@UseGuards(AuthGuard, PermissionGuard)
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @RequirePermission(PERMISSIONS.WORK_ORDER_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createWorkOrder(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = createWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.createWorkOrder(
      {
        ...parsed,
        organizationId: (body as Record<string, unknown>).organizationId as string,
        communityId:
          ((body as Record<string, unknown>).communityId as string) ||
          (parsed as any).communityId ||
          (body as any).communityId,
      },
      actor,
    );
    return this.mapDetailDto(workOrder);
  }

  @Get()
  @RequirePermission(PERMISSIONS.WORK_ORDER_VIEW)
  async listWorkOrders(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('currentState') currentState?: string,
    @Query('workType') workType?: WorkOrderType,
    @Query('priority') priority?: WorkOrderPriority,
    @Query('categoryId') categoryId?: string,
    @Query('primaryTeamId') primaryTeamId?: string,
    @Query('primaryAssigneeId') primaryAssigneeId?: string,
    @Query('buildingId') buildingId?: string,
    @Query('unitId') unitId?: string,
    @Query('source') source?: WorkOrderSource,
    @Query('maintenancePlanId') maintenancePlanId?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('isOverdue') isOverdue?: string,
    @Query('dueFrom') dueFrom?: string,
    @Query('dueTo') dueTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'dueAt' | 'priority' | 'workOrderNumber',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<{
    items: WorkOrderSummaryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.workOrderService.listWorkOrders({
      organizationId,
      communityId,
      currentState,
      workType,
      priority,
      categoryId,
      primaryTeamId,
      primaryAssigneeId,
      buildingId,
      unitId,
      source,
      maintenancePlanId,
      isBlocked: isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined,
      isOverdue: isOverdue === 'true' ? true : isOverdue === 'false' ? false : undefined,
      dueFrom: dueFrom ? new Date(dueFrom) : undefined,
      dueTo: dueTo ? new Date(dueTo) : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy,
      sortOrder,
    });

    return {
      items: result.items.map((w) =>
        toWorkOrderSummaryDto(w, {
          categoryName: w.category?.name,
          unitNumber: w.unit?.unitNumber,
          buildingName: w.building?.name,
          primaryTeamName: w.primaryTeam?.name,
          primaryAssigneeName: w.primaryAssignee?.displayName,
        }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('analytics/kpi')
  @RequirePermission(PERMISSIONS.FACILITY_ANALYTICS_VIEW)
  async getKpi(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<FacilityKpiMetrics> {
    return this.workOrderService.getKpiMetrics(organizationId, communityId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.WORK_ORDER_VIEW)
  async getWorkOrder(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.getWorkOrderById(id);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.WORK_ORDER_UPDATE)
  async updateWorkOrder(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() _actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const _parsed = updateWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.getWorkOrderById(id);
    return this.mapDetailDto(workOrder);
  }

  @Get(':id/actions')
  @RequirePermission(PERMISSIONS.WORK_ORDER_VIEW)
  async getAllowedActions(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<Array<{ action: string; label: string; toState: string }>> {
    return this.workOrderService.getAllowedActions(id, actor);
  }

  @Post(':id/actions/:action')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TRANSITION)
  @HttpCode(HttpStatus.OK)
  async executeAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() body: { reason?: string; comment?: string },
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.executeWorkflowAction(
      id,
      action,
      body.reason,
      body.comment,
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/assign')
  @RequirePermission(PERMISSIONS.WORK_ORDER_ASSIGN)
  @HttpCode(HttpStatus.OK)
  async assignWorkOrder(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = assignWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.assignWorkOrder(
      id,
      parsed.teamId,
      parsed.assigneeId,
      parsed.reason,
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/claim')
  @RequirePermission(PERMISSIONS.WORK_ORDER_CLAIM)
  @HttpCode(HttpStatus.OK)
  async claimWorkOrder(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.claimWorkOrder(id, actor);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/start')
  @RequirePermission(PERMISSIONS.WORK_ORDER_START)
  @HttpCode(HttpStatus.OK)
  async startWork(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.startWork(id, actor);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/pause')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TRANSITION)
  @HttpCode(HttpStatus.OK)
  async pauseWork(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.pauseWork(id, actor);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/resume')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TRANSITION)
  @HttpCode(HttpStatus.OK)
  async resumeWork(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.resumeWork(id, actor);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/block')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TRANSITION)
  @HttpCode(HttpStatus.OK)
  async blockWork(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = blockWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.blockWork(
      id,
      parsed.reason,
      parsed.category,
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/complete')
  @RequirePermission(PERMISSIONS.WORK_ORDER_COMPLETE)
  @HttpCode(HttpStatus.OK)
  async completeWork(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = completeWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.completeWork(
      id,
      parsed.completionSummary,
      parsed.resolutionCode,
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/supervisor-review')
  @RequirePermission(PERMISSIONS.WORK_ORDER_VERIFY)
  @HttpCode(HttpStatus.OK)
  async supervisorReview(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = supervisorReviewSchema.parse(body);
    const workOrder = await this.workOrderService.supervisorReview(
      id,
      parsed.decision,
      parsed.reviewNotes,
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.WORK_ORDER_CANCEL)
  @HttpCode(HttpStatus.OK)
  async cancelWorkOrder(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.workOrderService.cancelWorkOrder(id, body.reason, actor);
    const allowedActions = await this.workOrderService.getAllowedActions(id, actor);
    return this.mapDetailDto(workOrder, allowedActions, actor);
  }

  // ---------------------------------------------------------------------------
  // Tasks Sub-Endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/tasks')
  @RequirePermission(PERMISSIONS.WORK_ORDER_UPDATE)
  @HttpCode(HttpStatus.CREATED)
  async addTask(@Param('id') id: string, @Body() body: unknown): Promise<WorkOrderTaskResponseDto> {
    const parsed = createWorkOrderTaskSchema.parse(body);
    const task = await this.workOrderService.addTask(id, parsed);
    return toWorkOrderTaskDto(task as any);
  }

  @Patch(':id/tasks/:taskId')
  @RequirePermission(PERMISSIONS.WORK_ORDER_UPDATE)
  async updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderTaskResponseDto> {
    const parsed = updateWorkOrderTaskSchema.parse(body);
    const task = await this.workOrderService.updateTask(id, taskId, parsed, actor);
    return toWorkOrderTaskDto(task as any);
  }

  // ---------------------------------------------------------------------------
  // Checklists Sub-Endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/checklists')
  @RequirePermission(PERMISSIONS.WORK_ORDER_UPDATE)
  @HttpCode(HttpStatus.OK)
  async submitChecklistResult(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderChecklistResultResponseDto> {
    const parsed = submitChecklistResultSchema.parse(body);
    const result = await this.workOrderService.submitChecklistResult(id, parsed, actor);
    return toWorkOrderChecklistResultDto(result as any);
  }

  // ---------------------------------------------------------------------------
  // Work Logs & Timers Sub-Endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/logs/timer/start')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TIME_LOG)
  @HttpCode(HttpStatus.CREATED)
  async startTimer(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkLogResponseDto> {
    const parsed = startWorkLogTimerSchema.parse(body);
    const log = await this.workOrderService.startTimer(id, parsed.type, parsed.notes, actor);
    return toWorkLogDto(log as any);
  }

  @Post(':id/logs/timer/stop')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TIME_LOG)
  @HttpCode(HttpStatus.OK)
  async stopTimer(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkLogResponseDto> {
    const parsed = stopWorkLogTimerSchema.parse(body);
    const log = await this.workOrderService.stopTimer(id, parsed.notes, actor);
    return toWorkLogDto(log as any);
  }

  @Post(':id/logs/manual')
  @RequirePermission(PERMISSIONS.WORK_ORDER_TIME_LOG)
  @HttpCode(HttpStatus.CREATED)
  async addManualLog(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkLogResponseDto> {
    const parsed = createManualWorkLogSchema.parse(body);
    const log = await this.workOrderService.addManualWorkLog(id, parsed, actor);
    return toWorkLogDto(log as any);
  }

  // ---------------------------------------------------------------------------
  // Evidence Sub-Endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/evidence')
  @RequirePermission(PERMISSIONS.WORK_ORDER_UPDATE)
  @HttpCode(HttpStatus.CREATED)
  async attachEvidence(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderEvidenceResponseDto> {
    const parsed = attachWorkOrderEvidenceSchema.parse(body);
    const evidence = await this.workOrderService.attachEvidence(
      id,
      parsed.documentId,
      parsed.evidenceType,
      parsed.caption,
      actor,
    );
    return toWorkOrderEvidenceDto(evidence as any);
  }

  // ---------------------------------------------------------------------------
  // CSV Export
  // ---------------------------------------------------------------------------

  @Get('export/csv')
  @RequirePermission(PERMISSIONS.WORK_ORDER_EXPORT)
  async exportCsv(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.workOrderService.listWorkOrders({
      organizationId,
      communityId,
      limit: 1000,
    });

    const headers =
      'WorkOrderNumber,Title,WorkType,Priority,Status,Team,Assignee,DueAt,CreatedAt\n';
    const rows = result.items
      .map(
        (w) =>
          `"${w.workOrderNumber}","${w.title.replace(/"/g, '""')}","${w.workType}","${w.priority}","${w.currentState}","${w.primaryTeam?.name || ''}","${w.primaryAssignee?.displayName || ''}","${w.dueAt ? new Date(w.dueAt).toISOString() : ''}","${new Date(w.createdAt).toISOString()}"`,
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="work-orders.csv"');
    res.send(headers + rows);
  }

  // ---------------------------------------------------------------------------
  // Helper DTO Mapper
  // ---------------------------------------------------------------------------

  private mapDetailDto(
    wo: WorkOrderWithRelations,
    allowedActions?: Array<{ action: string; label: string; toState: string }>,
    actor?: Actor,
  ): WorkOrderDetailResponseDto {
    const activeLog = actor ? wo.workLogs?.find((l) => l.userId === actor.id && !l.endedAt) : null;

    return toWorkOrderDetailDto(wo, {
      categoryName: wo.category?.name,
      propertySectionName: wo.propertySection?.name,
      buildingName: wo.building?.name,
      floorLabel: wo.floor?.label,
      unitNumber: wo.unit?.unitNumber,
      primaryTeamName: wo.primaryTeam?.name,
      primaryAssigneeName: wo.primaryAssignee?.displayName,
      maintenancePlanName: wo.maintenancePlan?.name,
      verifiedByName: wo.verifiedByUser?.displayName,
      cancelledByName: wo.cancelledByUser?.displayName,
      createdByName: wo.createdByUser?.displayName,
      tasks: wo.tasks?.map((t) =>
        toWorkOrderTaskDto(t, {
          assignedUserName: t.assignedUser?.displayName,
          completedByName: t.completedByUser?.displayName,
        }),
      ),
      checklistResults: wo.checklistResults?.map((c) =>
        toWorkOrderChecklistResultDto(c as any as any, {
          completedByName: c.completedByUser?.displayName,
        }),
      ),
      workLogs: wo.workLogs?.map((l) =>
        toWorkLogDto(l as any, {
          userName: l.user?.displayName,
        }),
      ),
      evidence: wo.evidence?.map((e) =>
        toWorkOrderEvidenceDto(e, {
          uploadedByName: e.uploadedByUser?.displayName,
        }),
      ),
      completionAttempts: wo.completionAttempts?.map((a) => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        submittedById: a.submittedById,
        submittedByName: a.submittedByUser?.displayName,
        submittedAt:
          ((a as any).submittedAt ?? a.createdAt instanceof Date)
            ? ((a as any).submittedAt ?? a.createdAt.toISOString())
            : String((a as any).submittedAt ?? a.createdAt),
        summary: a.summary,
        reviewOutcome: a.reviewOutcome,
        reviewerId: a.reviewerId,
        reviewerName: a.reviewerUser?.displayName,
        reviewedAt: a.reviewedAt
          ? a.reviewedAt instanceof Date
            ? a.reviewedAt.toISOString()
            : String(a.reviewedAt)
          : null,
        reviewNotes: a.reviewNotes,
      })),
      linkedTickets: wo.ticketLinks?.map((l: any) => ({
        id: String(l.id || l.ticketId),
        ticketId: String(l.ticketId),
        ticketNumber: String(l.ticket?.ticketNumber || ''),
        ticketTitle: String(l.ticket?.title || ''),
        relationshipType: l.relationshipType,
      })),
      allowedActions,
      activeTimer: activeLog
        ? {
            id: activeLog.id,
            startedAt:
              activeLog.startedAt instanceof Date
                ? activeLog.startedAt.toISOString()
                : String(activeLog.startedAt),
            userId: activeLog.userId,
          }
        : null,
    });
  }
}

// =============================================================================
// Ticket to Work Order Link Controller
// =============================================================================

@Controller('tickets/:ticketId/work-orders')
@UseGuards(AuthGuard, PermissionGuard)
export class TicketWorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @RequirePermission(PERMISSIONS.WORK_ORDER_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createWorkOrderFromTicket(
    @Param('ticketId') ticketId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderDetailResponseDto> {
    const parsed = createWorkOrderSchema.parse(body);
    const workOrder = await this.workOrderService.createWorkOrder(
      {
        ...parsed,
        ticketId,
        organizationId: (body as Record<string, unknown>).organizationId as string,
        communityId: String(
          (body as Record<string, unknown>).communityId || (parsed as any).communityId || '',
        ),
      },
      actor,
    );
    const allowedActions = await this.workOrderService.getAllowedActions(workOrder.id, actor);
    return toWorkOrderDetailDto(workOrder, {
      categoryName: workOrder.category?.name,
      primaryTeamName: workOrder.primaryTeam?.name,
      primaryAssigneeName: workOrder.primaryAssignee?.displayName,
      allowedActions,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.WORK_ORDER_VIEW)
  async listWorkOrdersForTicket(
    @Param('ticketId') ticketId: string,
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
  ): Promise<WorkOrderSummaryResponseDto[]> {
    const result = await this.workOrderService.listWorkOrders({
      organizationId,
      communityId,
    });
    const linked = result.items.filter((wo) =>
      wo.ticketLinks?.some((l) => l.ticketId === ticketId),
    );
    return linked.map((wo) =>
      toWorkOrderSummaryDto(wo, {
        categoryName: wo.category?.name,
        unitNumber: wo.unit?.unitNumber,
        buildingName: wo.building?.name,
        primaryTeamName: wo.primaryTeam?.name,
        primaryAssigneeName: wo.primaryAssignee?.displayName,
      }),
    );
  }
}
