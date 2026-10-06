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
import { MembershipsService } from './memberships.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  createMembershipSchema,
  changeMembershipStatusSchema,
  membershipQuerySchema,
} from '@community-os/validation';

@ApiTags('Tenant Memberships')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.MEMBERSHIP_INVITE)
  @ApiOperation({ summary: 'Create or invite a tenant membership' })
  @ApiResponse({ status: 201, description: 'Membership created' })
  @ApiResponse({ status: 409, description: 'Membership already exists' })
  async create(@Body() body: unknown) {
    const validated = createMembershipSchema.parse(body);
    return this.membershipsService.create(validated);
  }

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERSHIP_VIEW)
  @ApiOperation({ summary: 'List tenant memberships within scope' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'communityId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'],
  })
  @ApiResponse({ status: 200, description: 'List of memberships' })
  async findMany(@Query() query: Record<string, unknown>) {
    const validated = membershipQuerySchema.parse(query);
    const result = await this.membershipsService.findMany(validated);
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

  @Get(':membershipId')
  @RequirePermission(PERMISSIONS.MEMBERSHIP_VIEW)
  @ApiOperation({ summary: 'Get membership details' })
  @ApiResponse({ status: 200, description: 'Membership details' })
  async findOne(@Param('membershipId') id: string) {
    return this.membershipsService.findById(id);
  }

  @Patch(':membershipId/status')
  @RequirePermission(PERMISSIONS.MEMBERSHIP_UPDATE)
  @ApiOperation({ summary: 'Change membership status (ACTIVE, SUSPENDED, REVOKED, EXPIRED)' })
  @ApiResponse({ status: 200, description: 'Membership status updated' })
  async changeStatus(@Param('membershipId') id: string, @Body() body: unknown) {
    const validated = changeMembershipStatusSchema.parse(body);
    return this.membershipsService.changeStatus(id, validated);
  }
}
