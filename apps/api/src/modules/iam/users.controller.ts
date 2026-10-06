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
import { UsersService } from './users.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  createUserSchema,
  updateUserSchema,
  changeUserStatusSchema,
  userQuerySchema,
} from '@community-os/validation';

@ApiTags('Users & Identities')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(PERMISSIONS.USER_CREATE)
  @ApiOperation({ summary: 'Provision or invite a new user account' })
  @ApiResponse({ status: 201, description: 'User account created' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async create(@Body() body: unknown) {
    const validated = createUserSchema.parse(body);
    return this.usersService.create(validated);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USER_VIEW)
  @ApiOperation({ summary: 'List user accounts in authorized scope' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'communityId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'ARCHIVED'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async findMany(@Query() query: Record<string, unknown>) {
    const validated = userQuerySchema.parse(query);
    const result = await this.usersService.findMany(validated);
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

  @Get(':userId')
  @RequirePermission(PERMISSIONS.USER_VIEW)
  @ApiOperation({ summary: 'Get user account details by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('userId') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':userId')
  @RequirePermission(PERMISSIONS.USER_UPDATE)
  @ApiOperation({ summary: 'Update user profile details' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('userId') id: string, @Body() body: unknown) {
    const validated = updateUserSchema.parse(body);
    return this.usersService.update(id, validated);
  }

  @Patch(':userId/status')
  @RequirePermission(PERMISSIONS.USER_STATUS_CHANGE)
  @ApiOperation({
    summary: 'Change user account lifecycle status (ACTIVE, SUSPENDED, LOCKED, ARCHIVED)',
  })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async changeStatus(@Param('userId') id: string, @Body() body: unknown) {
    const validated = changeUserStatusSchema.parse(body);
    return this.usersService.changeStatus(id, validated);
  }
}
