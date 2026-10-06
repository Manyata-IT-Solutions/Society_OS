import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { CommunityService } from './community.service.js';
import { CurrentTenant } from '../../common/decorators/tenant.decorator.js';
import {
  createCommunitySchema,
  updateCommunitySchema,
  changeCommunityStatusSchema,
  communityQuerySchema,
} from '@community-os/validation';
import { toCommunityResponseDto, type CommunityResponseDto } from '@community-os/contracts';
import type { TenantContext } from '@community-os/types';

@ApiTags('Communities')
@Controller()
export class CommunitiesController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('organizations/:organizationId/communities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision a new community under an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiHeader({
    name: 'x-organization-id',
    required: false,
    description: 'Tenant header (auto-resolved from route)',
  })
  @ApiResponse({ status: 201, description: 'Community successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Duplicate community code or slug' })
  async createForOrganization(
    @Param('organizationId') organizationId: string,
    @Body() body: unknown,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<CommunityResponseDto> {
    const validated = createCommunitySchema.parse(body);
    const tenantCtx: TenantContext = {
      ...ctx,
      organizationId,
    };
    const community = await this.communityService.create(tenantCtx, validated);
    return toCommunityResponseDto(community);
  }

  @Get('organizations/:organizationId/communities')
  @ApiOperation({ summary: 'List all communities belonging to an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of communities' })
  async findManyForOrganization(
    @Param('organizationId') organizationId: string,
    @Query() query: Record<string, unknown>,
    @CurrentTenant() ctx: TenantContext,
  ) {
    const validated = communityQuerySchema.parse({
      ...query,
      organizationId,
    });
    const tenantCtx: TenantContext = {
      ...ctx,
      organizationId,
    };
    const result = await this.communityService.findMany(tenantCtx, validated);
    return {
      data: result.items.map(toCommunityResponseDto),
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

  @Get('communities/:communityId')
  @ApiOperation({ summary: 'Get community details by ID' })
  @ApiParam({ name: 'communityId', description: 'Community UUID' })
  @ApiResponse({ status: 200, description: 'Community details' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  async findOne(
    @Param('communityId') id: string,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<CommunityResponseDto> {
    const community = ctx.organizationId
      ? await this.communityService.findById(ctx, id)
      : await this.communityService.findByIdUnscoped(id);
    return toCommunityResponseDto(community);
  }

  @Patch('communities/:communityId')
  @ApiOperation({ summary: 'Update community details' })
  @ApiParam({ name: 'communityId', description: 'Community UUID' })
  @ApiResponse({ status: 200, description: 'Community updated successfully' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  @ApiResponse({ status: 409, description: 'Concurrency conflict or duplicate code/slug' })
  async update(
    @Param('communityId') id: string,
    @Body() body: unknown,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<CommunityResponseDto> {
    const validated = updateCommunitySchema.parse(body);
    // If ctx has no organizationId, resolve from community first
    const resolvedCtx = ctx.organizationId
      ? ctx
      : {
          ...ctx,
          organizationId: (await this.communityService.findByIdUnscoped(id)).organizationId,
        };

    const updated = await this.communityService.update(resolvedCtx, id, validated);
    return toCommunityResponseDto(updated);
  }

  @Patch('communities/:communityId/status')
  @ApiOperation({ summary: 'Change community lifecycle status (ACTIVE, SUSPENDED, ARCHIVED)' })
  @ApiParam({ name: 'communityId', description: 'Community UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 409, description: 'Concurrency conflict' })
  async changeStatus(
    @Param('communityId') id: string,
    @Body() body: unknown,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<CommunityResponseDto> {
    const validated = changeCommunityStatusSchema.parse(body);
    const resolvedCtx = ctx.organizationId
      ? ctx
      : {
          ...ctx,
          organizationId: (await this.communityService.findByIdUnscoped(id)).organizationId,
        };

    const updated = await this.communityService.changeStatus(resolvedCtx, id, validated);
    return toCommunityResponseDto(updated);
  }
}
