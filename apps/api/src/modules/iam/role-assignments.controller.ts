import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleAssignmentsService } from './role-assignments.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { createRoleAssignmentSchema, roleAssignmentQuerySchema } from '@community-os/validation';
import type { Actor } from '@community-os/types';

@ApiTags('Role Assignments & Scopes')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('role-assignments')
export class RoleAssignmentsController {
  constructor(private readonly roleAssignmentsService: RoleAssignmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.ROLE_ASSIGN)
  @ApiOperation({ summary: 'Assign a role to a user within an explicit scope' })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  @ApiResponse({ status: 403, description: 'Privilege escalation denied' })
  async create(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = createRoleAssignmentSchema.parse(body);
    return this.roleAssignmentsService.create(actor, validated);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ROLE_VIEW)
  @ApiOperation({ summary: 'List role assignments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'roleId', required: false, type: String })
  @ApiQuery({
    name: 'scopeType',
    required: false,
    enum: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY', 'OWN'],
  })
  @ApiQuery({ name: 'scopeId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'REVOKED'] })
  @ApiResponse({ status: 200, description: 'List of role assignments' })
  async findMany(@Query() query: Record<string, unknown>) {
    const validated = roleAssignmentQuerySchema.parse(query);
    const result = await this.roleAssignmentsService.findMany(validated);
    return {
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page: result.page,
          limit: result.limit,
          totalItems: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        },
      },
    };
  }

  @Delete(':assignmentId')
  @RequirePermission(PERMISSIONS.ROLE_REVOKE)
  @ApiOperation({ summary: 'Revoke a role assignment' })
  @ApiResponse({ status: 200, description: 'Role assignment revoked' })
  @ApiResponse({ status: 403, description: 'Privilege escalation denied' })
  async revoke(@Param('assignmentId') id: string, @CurrentActor() actor: Actor) {
    return this.roleAssignmentsService.revoke(actor, id);
  }
}
