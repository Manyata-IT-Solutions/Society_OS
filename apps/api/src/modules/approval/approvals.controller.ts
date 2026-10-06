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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApprovalService } from './approval.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateApprovalPolicySchema, SubmitApprovalDecisionSchema } from '@community-os/validation';
import {
  toApprovalPolicyDto,
  toApprovalInstanceDto,
  toApprovalDecisionDto,
  type ApprovalPolicyResponseDto,
  type ApprovalInstanceResponseDto,
  type ApprovalDecisionResponseDto,
  type MyApprovalInboxItemDto,
} from '@community-os/contracts';

@Controller('approvals')
@UseGuards(AuthGuard, PermissionGuard)
export class ApprovalsController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('policies')
  @RequirePermission(PERMISSIONS.APPROVAL_POLICY_VIEW)
  async listPolicies(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: ApprovalPolicyResponseDto[]; total: number }> {
    const res = await this.approvalService.listPolicies({
      organizationId,
      communityId,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map(toApprovalPolicyDto),
      total: res.total,
    };
  }

  @Get('policies/:id')
  @RequirePermission(PERMISSIONS.APPROVAL_POLICY_VIEW)
  async getPolicy(@Param('id') id: string): Promise<ApprovalPolicyResponseDto> {
    const policy = await this.approvalService.getPolicyById(id);
    return toApprovalPolicyDto(policy);
  }

  @Post('policies')
  @RequirePermission(PERMISSIONS.APPROVAL_POLICY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createPolicy(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<ApprovalPolicyResponseDto> {
    const parsed = CreateApprovalPolicySchema.parse(body);
    const created = await this.approvalService.createPolicyDraft(
      parsed as unknown as Parameters<typeof this.approvalService.createPolicyDraft>[0],
      actor,
    );
    return toApprovalPolicyDto(created);
  }

  @Post('policies/:id/publish')
  @RequirePermission(PERMISSIONS.APPROVAL_POLICY_MANAGE)
  @HttpCode(HttpStatus.OK)
  async publishPolicy(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<ApprovalPolicyResponseDto> {
    const published = await this.approvalService.publishPolicy(id, actor);
    return toApprovalPolicyDto(published);
  }

  @Get('inbox')
  @RequirePermission(PERMISSIONS.APPROVAL_DECISION)
  async getMyInbox(
    @CurrentActor() actor: Actor,
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: MyApprovalInboxItemDto[]; total: number }> {
    return this.approvalService.listInbox(actor, {
      organizationId,
      communityId,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }

  @Get('instances/:id')
  @RequirePermission(PERMISSIONS.APPROVAL_POLICY_VIEW)
  async getInstance(@Param('id') id: string) {
    const inst = await this.approvalService.getById(id);
    return {
      ...toApprovalInstanceDto(inst),
      steps: inst.steps,
      decisions: inst.decisions.map(toApprovalDecisionDto),
    };
  }

  @Post('steps/:id/decisions')
  @RequirePermission(PERMISSIONS.APPROVAL_DECISION)
  @HttpCode(HttpStatus.OK)
  async submitDecision(
    @Param('id') stepInstanceId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
    @Req() req: Request,
  ): Promise<{
    decision: ApprovalDecisionResponseDto;
    approvalInstance: ApprovalInstanceResponseDto;
  }> {
    const parsed = SubmitApprovalDecisionSchema.parse(body);
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || undefined;

    const result = await this.approvalService.submitDecision(
      stepInstanceId,
      parsed.decision,
      parsed.comment,
      actor,
      requestId,
      correlationId,
    );

    return {
      decision: toApprovalDecisionDto(result.decision),
      approvalInstance: toApprovalInstanceDto(result.approvalInstance),
    };
  }
}
