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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from './organization.service.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  changeOrganizationStatusSchema,
  organizationQuerySchema,
} from '@community-os/validation';
import { toOrganizationResponseDto, type OrganizationResponseDto } from '@community-os/contracts';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization / enterprise customer' })
  @ApiResponse({ status: 201, description: 'Organization successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Duplicate slug' })
  async create(@Body() body: unknown): Promise<OrganizationResponseDto> {
    const validated = createOrganizationSchema.parse(body);
    const org = await this.organizationService.create(validated);
    return toOrganizationResponseDto(org);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations with pagination, search, and status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of organizations' })
  async findMany(@Query() query: Record<string, unknown>) {
    const validated = organizationQuerySchema.parse(query);
    const result = await this.organizationService.findMany(validated);
    return {
      data: result.items.map(toOrganizationResponseDto),
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

  @Get(':organizationId')
  @ApiOperation({ summary: 'Get organization details by ID or slug' })
  @ApiParam({ name: 'organizationId', description: 'UUID or unique slug' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('organizationId') idOrSlug: string): Promise<OrganizationResponseDto> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const org = isUuid
      ? await this.organizationService.findById(idOrSlug)
      : await this.organizationService.findBySlug(idOrSlug);
    return toOrganizationResponseDto(org);
  }

  @Patch(':organizationId')
  @ApiOperation({
    summary: 'Update organization details (supports optimistic locking via expectedVersion)',
  })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization successfully updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'Concurrency conflict or duplicate slug' })
  async update(
    @Param('organizationId') id: string,
    @Body() body: unknown,
  ): Promise<OrganizationResponseDto> {
    const validated = updateOrganizationSchema.parse(body);
    const updated = await this.organizationService.update(id, validated);
    return toOrganizationResponseDto(updated);
  }

  @Patch(':organizationId/status')
  @ApiOperation({ summary: 'Change organization lifecycle status (ACTIVE, SUSPENDED, ARCHIVED)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 409, description: 'Concurrency conflict' })
  async changeStatus(
    @Param('organizationId') id: string,
    @Body() body: unknown,
  ): Promise<OrganizationResponseDto> {
    const validated = changeOrganizationStatusSchema.parse(body);
    const updated = await this.organizationService.changeStatus(id, validated);
    return toOrganizationResponseDto(updated);
  }
}
