import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketService } from './ticket.service.js';
import type { TicketRecordWithRelations } from './ticket.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, Ticket } from '@community-os/types';
import {
  createTicketSchema,
  createResidentTicketSchema,
  assignTicketSchema,
  changeTicketPrioritySchema,
  transitionTicketSchema,
  resolveTicketSchema,
  closeTicketSchema,
  reopenTicketSchema,
  cancelTicketSchema,
  createTicketCommentSchema,
  createTicketFeedbackSchema,
  linkTicketRelationSchema,
  slaOverrideTicketSchema,
  ticketFilterSchema,
} from '@community-os/validation';
import {
  toTicketDetailDto,
  toTicketCommentDto,
  toTicketFeedbackDto,
  toTicketRelationDto,
  toTicketTimelineItemDto,
  type TicketDetailResponseDto,
  type TicketSummaryResponseDto,
  type TicketCommentResponseDto,
  type TicketFeedbackResponseDto,
  type TicketRelationResponseDto,
  type TicketTimelineItemResponseDto,
  type HelpdeskKpiMetricsResponseDto,
} from '@community-os/contracts';

// =============================================================================
// STAFF & ADMIN HELPDESK CONTROLLER
// =============================================================================

@Controller('helpdesk')
@UseGuards(AuthGuard, PermissionGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_CREATE)
  async createTicket(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = createTicketSchema.parse(body);
    const ticket = await this.ticketService.createTicket(validated, actor);
    const fullTicket = await this.ticketService.getTicketById(ticket.id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Get('tickets')
  @RequirePermission(PERMISSIONS.TICKET_VIEW)
  async listTickets(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: TicketSummaryResponseDto[]; total: number; page: number; limit: number }> {
    const validated = ticketFilterSchema.parse(query);
    const { items, total } = await this.ticketService.listTickets(validated, actor);
    return {
      items: items.map((t) => this.mapTicketSummaryToDto(t)),
      total,
      page: validated.page ?? 1,
      limit: validated.limit ?? 20,
    };
  }

  @Get('tickets/:id')
  @RequirePermission(PERMISSIONS.TICKET_VIEW)
  async getTicket(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Get('tickets/:id/timeline')
  @RequirePermission(PERMISSIONS.TICKET_VIEW)
  async getTimeline(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketTimelineItemResponseDto[]> {
    const items = await this.ticketService.getTimeline(id, actor);
    return items.map((i) => toTicketTimelineItemDto(i));
  }

  @Get('tickets/:id/comments')
  @RequirePermission(PERMISSIONS.TICKET_VIEW)
  async getComments(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCommentResponseDto[]> {
    const comments = await this.ticketService.getComments(id, actor);
    return comments.map((c) => toTicketCommentDto(c, c.authorName));
  }

  @Post('tickets/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_COMMENT)
  async addComment(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCommentResponseDto> {
    const validated = createTicketCommentSchema.parse(body);
    const comment = await this.ticketService.addComment(id, validated, actor);
    return toTicketCommentDto(comment);
  }

  @Post('tickets/:id/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_ASSIGN)
  async assignTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = assignTicketSchema.parse(body);
    await this.ticketService.assignTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/claim')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_CLAIM)
  async claimTicket(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    await this.ticketService.claimTicket(id, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/priority')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_CHANGE_PRIORITY)
  async changePriority(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = changeTicketPrioritySchema.parse(body);
    await this.ticketService.changePriority(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/transition')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_TRANSITION)
  async transitionTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = transitionTicketSchema.parse(body);
    await this.ticketService.transitionTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_RESOLVE)
  async resolveTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = resolveTicketSchema.parse(body);
    await this.ticketService.resolveTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_CLOSE)
  async closeTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = closeTicketSchema.parse(body);
    await this.ticketService.closeTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/reopen')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_REOPEN)
  async reopenTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = reopenTicketSchema.parse(body);
    await this.ticketService.reopenTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_CANCEL)
  async cancelTicket(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = cancelTicketSchema.parse(body);
    await this.ticketService.cancelTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/sla-override')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_SLA_OVERRIDE)
  async overrideSla(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = slaOverrideTicketSchema.parse(body);
    await this.ticketService.overrideSla(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post('tickets/:id/relations')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_UPDATE)
  async linkRelation(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketRelationResponseDto> {
    const validated = linkTicketRelationSchema.parse(body);
    const relation = await this.ticketService.linkRelation(id, validated, actor);
    return toTicketRelationDto(relation);
  }

  @Get('analytics/kpi')
  @RequirePermission(PERMISSIONS.TICKET_ANALYTICS_VIEW)
  async getKpis(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<HelpdeskKpiMetricsResponseDto> {
    return this.ticketService.getKpiMetrics(organizationId, communityId);
  }

  // ---------------------------------------------------------------------------
  // Helper Mappers
  // ---------------------------------------------------------------------------

  private mapTicketSummaryToDto(
    t: Ticket & {
      category?: { name?: string | null } | null;
      subcategory?: { name?: string | null } | null;
      unit?: { unitNumber?: string | null } | null;
      building?: { name?: string | null } | null;
      reportedByUser?: { displayName?: string | null } | null;
      reportedByResident?: { displayName?: string | null } | null;
      assignedTeam?: { name?: string | null } | null;
      assignedUser?: { displayName?: string | null } | null;
      feedback?: { rating?: number | null } | null;
    },
  ): TicketSummaryResponseDto {
    return {
      id: t.id,
      organizationId: t.organizationId,
      communityId: t.communityId,
      ticketNumber: t.ticketNumber,
      title: t.title,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? undefined,
      subcategoryId: t.subcategoryId,
      subcategoryName: t.subcategory?.name ?? undefined,
      priority: t.priority,
      currentState: t.currentState,
      source: t.source,
      locationType: t.locationType,
      unitNumber: t.unit?.unitNumber ?? undefined,
      buildingName: t.building?.name ?? undefined,
      reportedByName:
        t.reportedByUser?.displayName || t.reportedByResident?.displayName || undefined,
      assignedTeamName: t.assignedTeam?.name ?? undefined,
      assignedUserName: t.assignedUser?.displayName ?? undefined,
      slaStatus: t.slaStatus,
      slaDueAt: t.slaDueAt ? new Date(t.slaDueAt).toISOString() : null,
      slaBreachedAt: t.slaBreachedAt ? new Date(t.slaBreachedAt).toISOString() : null,
      reopenCount: t.reopenCount,
      feedbackRating: t.feedback?.rating ?? null,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
    };
  }

  private mapFullTicketToDto(
    fullTicket: TicketRecordWithRelations & {
      allowedActions?: Array<{ action: string; label: string; toState: string }>;
    },
  ): TicketDetailResponseDto {
    return toTicketDetailDto(fullTicket, {
      categoryName: fullTicket.category?.name,
      subcategoryName: fullTicket.subcategory?.name,
      unitNumber: fullTicket.unit?.unitNumber,
      buildingName: fullTicket.building?.name,
      propertySectionName: fullTicket.propertySection?.name,
      floorLabel: fullTicket.floor?.label,
      reportedByName:
        fullTicket.reportedByUser?.displayName || fullTicket.reportedByResident?.displayName,
      assignedTeamName: fullTicket.assignedTeam?.name,
      assignedUserName: fullTicket.assignedUser?.displayName,
      resolvedByName: fullTicket.resolvedByUser?.displayName,
      duplicateOfTicketNumber: fullTicket.duplicateOfTicket?.ticketNumber,
      feedbackRating: fullTicket.feedback?.rating ?? null,
      feedback: fullTicket.feedback ? toTicketFeedbackDto(fullTicket.feedback) : null,
      allowedActions: fullTicket.allowedActions,
    });
  }
}

// =============================================================================
// RESIDENT COMPLAINTS CONTROLLER
// =============================================================================

@Controller('resident/complaints')
@UseGuards(AuthGuard, PermissionGuard)
export class ResidentComplaintController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_CREATE_OWN)
  async createComplaint(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = createResidentTicketSchema.parse(body);
    const ticket = await this.ticketService.createResidentTicket(validated, actor);
    const fullTicket = await this.ticketService.getTicketById(ticket.id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TICKET_VIEW_OWN)
  async listComplaints(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: TicketSummaryResponseDto[]; total: number; page: number; limit: number }> {
    const validated = ticketFilterSchema.parse(query);
    const { items, total } = await this.ticketService.listTickets(validated, actor);
    return {
      items: items.map((t) => this.mapTicketSummaryToDto(t)),
      total,
      page: validated.page ?? 1,
      limit: validated.limit ?? 20,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TICKET_VIEW_OWN)
  async getComplaint(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Get(':id/timeline')
  @RequirePermission(PERMISSIONS.TICKET_VIEW_OWN)
  async getTimeline(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketTimelineItemResponseDto[]> {
    const items = await this.ticketService.getTimeline(id, actor);
    return items.map((i) => toTicketTimelineItemDto(i));
  }

  @Get(':id/comments')
  @RequirePermission(PERMISSIONS.TICKET_VIEW_OWN)
  async getComments(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCommentResponseDto[]> {
    const comments = await this.ticketService.getComments(id, actor);
    return comments.map((c) => toTicketCommentDto(c, c.authorName));
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_COMMENT_OWN)
  async addComment(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketCommentResponseDto> {
    const validated = createTicketCommentSchema.parse(body);
    const comment = await this.ticketService.addComment(id, validated, actor);
    return toTicketCommentDto(comment);
  }

  @Post(':id/feedback')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.TICKET_VIEW_OWN)
  async submitFeedback(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketFeedbackResponseDto> {
    const validated = createTicketFeedbackSchema.parse(body);
    const feedback = await this.ticketService.submitFeedback(id, validated, actor);
    return toTicketFeedbackDto(feedback);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_REOPEN_OWN)
  async reopenComplaint(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = reopenTicketSchema.parse(body);
    await this.ticketService.reopenTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.TICKET_CANCEL_OWN)
  async cancelComplaint(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<TicketDetailResponseDto> {
    const validated = cancelTicketSchema.parse(body);
    await this.ticketService.cancelTicket(id, validated, actor);
    const fullTicket = await this.ticketService.getTicketById(id, actor);
    return this.mapFullTicketToDto(fullTicket);
  }

  private mapTicketSummaryToDto(
    t: Ticket & {
      category?: { name?: string | null } | null;
      subcategory?: { name?: string | null } | null;
      unit?: { unitNumber?: string | null } | null;
      building?: { name?: string | null } | null;
      reportedByUser?: { displayName?: string | null } | null;
      reportedByResident?: { displayName?: string | null } | null;
      assignedTeam?: { name?: string | null } | null;
      assignedUser?: { displayName?: string | null } | null;
      feedback?: { rating?: number | null } | null;
    },
  ): TicketSummaryResponseDto {
    return {
      id: t.id,
      organizationId: t.organizationId,
      communityId: t.communityId,
      ticketNumber: t.ticketNumber,
      title: t.title,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? undefined,
      subcategoryId: t.subcategoryId,
      subcategoryName: t.subcategory?.name ?? undefined,
      priority: t.priority,
      currentState: t.currentState,
      source: t.source,
      locationType: t.locationType,
      unitNumber: t.unit?.unitNumber ?? undefined,
      buildingName: t.building?.name ?? undefined,
      reportedByName:
        t.reportedByUser?.displayName || t.reportedByResident?.displayName || undefined,
      assignedTeamName: t.assignedTeam?.name ?? undefined,
      assignedUserName: t.assignedUser?.displayName ?? undefined,
      slaStatus: t.slaStatus,
      slaDueAt: t.slaDueAt ? new Date(t.slaDueAt).toISOString() : null,
      slaBreachedAt: t.slaBreachedAt ? new Date(t.slaBreachedAt).toISOString() : null,
      reopenCount: t.reopenCount,
      feedbackRating: t.feedback?.rating ?? null,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
    };
  }

  private mapFullTicketToDto(
    fullTicket: TicketRecordWithRelations & {
      allowedActions?: Array<{ action: string; label: string; toState: string }>;
    },
  ): TicketDetailResponseDto {
    return toTicketDetailDto(fullTicket, {
      categoryName: fullTicket.category?.name,
      subcategoryName: fullTicket.subcategory?.name,
      unitNumber: fullTicket.unit?.unitNumber,
      buildingName: fullTicket.building?.name,
      propertySectionName: fullTicket.propertySection?.name,
      floorLabel: fullTicket.floor?.label,
      reportedByName:
        fullTicket.reportedByUser?.displayName || fullTicket.reportedByResident?.displayName,
      assignedTeamName: fullTicket.assignedTeam?.name,
      assignedUserName: fullTicket.assignedUser?.displayName,
      resolvedByName: fullTicket.resolvedByUser?.displayName,
      duplicateOfTicketNumber: fullTicket.duplicateOfTicket?.ticketNumber,
      feedbackRating: fullTicket.feedback?.rating ?? null,
      feedback: fullTicket.feedback ? toTicketFeedbackDto(fullTicket.feedback) : null,
      allowedActions: fullTicket.allowedActions,
    });
  }
}
