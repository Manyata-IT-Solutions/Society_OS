import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { createRoleSchema, updateRoleSchema, roleQuerySchema } from '@community-os/validation';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermission(PERMISSIONS.PERMISSION_VIEW)
  @ApiOperation({ summary: 'List all system permissions in the registry' })
  @ApiResponse({ status: 200, description: 'List of system permissions' })
  async listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.ROLE_CREATE)
  @ApiOperation({ summary: 'Create a custom tenant role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 409, description: 'Role code already exists' })
  async createRole(@Body() body: unknown) {
    const validated = createRoleSchema.parse(body);
    return this.rolesService.create(validated);
  }

  @Get('roles')
  @RequirePermission(PERMISSIONS.ROLE_VIEW)
  @ApiOperation({ summary: 'List system and custom roles' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({
    name: 'scopeType',
    required: false,
    enum: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY', 'OWN'],
  })
  @ApiQuery({ name: 'isSystem', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of roles' })
  async findManyRoles(@Query() query: Record<string, unknown>) {
    const validated = roleQuerySchema.parse(query);
    const result = await this.rolesService.findMany(validated);
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

  @Get('roles/:roleId')
  @RequirePermission(PERMISSIONS.ROLE_VIEW)
  @ApiOperation({ summary: 'Get role details with mapped permissions' })
  @ApiResponse({ status: 200, description: 'Role details' })
  async findOneRole(@Param('roleId') id: string) {
    return this.rolesService.findById(id);
  }

  @Patch('roles/:roleId')
  @RequirePermission(PERMISSIONS.ROLE_UPDATE)
  @ApiOperation({ summary: 'Update custom role name, description, or permissions' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Cannot modify system roles' })
  async updateRole(@Param('roleId') id: string, @Body() body: unknown) {
    const validated = updateRoleSchema.parse(body);
    return this.rolesService.update(id, validated);
  }
}
