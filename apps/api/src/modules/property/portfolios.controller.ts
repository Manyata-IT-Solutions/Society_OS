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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  portfolioQuerySchema,
} from '@community-os/validation';
import { toPortfolioResponseDto, type PortfolioResponseDto } from '@community-os/contracts';

@ApiTags('Property - Portfolios')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller()
export class PortfoliosController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post('organizations/:organizationId/portfolios')
  @RequirePermission(PERMISSIONS.PORTFOLIO_CREATE, {
    scopeType: 'ORGANIZATION',
    scopeParam: 'organizationId',
  })
  @ApiOperation({ summary: 'Create a new portfolio under organization' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Portfolio created' })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() body: unknown,
  ): Promise<PortfolioResponseDto> {
    const validated = createPortfolioSchema.parse(body);
    const portfolio = await this.portfolioService.create(organizationId, validated);
    return toPortfolioResponseDto(portfolio);
  }

  @Get('organizations/:organizationId/portfolios')
  @RequirePermission(PERMISSIONS.PORTFOLIO_VIEW, {
    scopeType: 'ORGANIZATION',
    scopeParam: 'organizationId',
  })
  @ApiOperation({ summary: 'List portfolios for organization' })
  async findMany(
    @Param('organizationId') organizationId: string,
    @Query() query: unknown,
  ): Promise<{ items: PortfolioResponseDto[]; total: number }> {
    const validated = portfolioQuerySchema.parse(query);
    const result = await this.portfolioService.findMany(organizationId, validated);
    return {
      items: result.items.map((p) => toPortfolioResponseDto(p)),
      total: result.total,
    };
  }

  @Get('portfolios/:portfolioId')
  @RequirePermission(PERMISSIONS.PORTFOLIO_VIEW)
  @ApiOperation({ summary: 'Get portfolio details by ID' })
  async findById(@Param('portfolioId') portfolioId: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.findById(portfolioId);
    return toPortfolioResponseDto(portfolio);
  }

  @Patch('portfolios/:portfolioId')
  @RequirePermission(PERMISSIONS.PORTFOLIO_UPDATE)
  @ApiOperation({ summary: 'Update portfolio metadata' })
  async update(
    @Param('portfolioId') portfolioId: string,
    @Body() body: unknown,
  ): Promise<PortfolioResponseDto> {
    const validated = updatePortfolioSchema.parse(body);
    const updated = await this.portfolioService.update(portfolioId, validated);
    return toPortfolioResponseDto(updated);
  }

  @Patch('portfolios/:portfolioId/archive')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.PORTFOLIO_ARCHIVE)
  @ApiOperation({ summary: 'Archive a portfolio' })
  async archive(
    @Param('portfolioId') portfolioId: string,
    @Body('version') version: number,
  ): Promise<PortfolioResponseDto> {
    const updated = await this.portfolioService.archive(portfolioId, version || 1);
    return toPortfolioResponseDto(updated);
  }
}
