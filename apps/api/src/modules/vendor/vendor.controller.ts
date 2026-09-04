import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VendorService } from './vendor.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateVendorSchema,
  VendorStatusActionSchema,
  CreateVendorRatingSchema,
} from '@community-os/validation';
import { toVendorDto, toVendorRatingDto } from '@community-os/contracts';

@Controller('vendors')
@UseGuards(AuthGuard, PermissionGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @RequirePermission(PERMISSIONS.VENDOR_CREATE)
  async createVendor(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreateVendorSchema.parse(body);
    const vendor = await this.vendorService.createVendor(validated as any, actor);
    return toVendorDto(vendor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.VENDOR_VIEW)
  async listVendors(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: any,
    @Query('onboardingStatus') onboardingStatus?: any,
    @Query('vendorType') vendorType?: any,
    @Query('search') search?: string,
    @Query('isPreferred') isPreferred?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.vendorService.listVendors({
      organizationId,
      communityId,
      status,
      onboardingStatus,
      vendorType,
      search,
      isPreferred: isPreferred !== undefined ? isPreferred === 'true' : undefined,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: result.items.map(toVendorDto),
      total: result.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.VENDOR_VIEW)
  async getVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const vendor = await this.vendorService.getVendor(id, organizationId);
    return toVendorDto(vendor);
  }

  @Post(':id/submit')
  @RequirePermission(PERMISSIONS.VENDOR_SUBMIT)
  async submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('organizationId') organizationId: string,
    @CurrentActor() actor: Actor,
  ) {
    const vendor = await this.vendorService.submitForReview(id, organizationId, actor);
    return toVendorDto(vendor);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.VENDOR_APPROVE)
  async approveVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('organizationId') organizationId: string,
    @CurrentActor() actor: Actor,
  ) {
    const vendor = await this.vendorService.approveVendor(id, organizationId, actor);
    return toVendorDto(vendor);
  }

  @Post(':id/suspend')
  @RequirePermission(PERMISSIONS.VENDOR_SUSPEND)
  async suspendVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const { reason } = VendorStatusActionSchema.parse(body);
    const vendor = await this.vendorService.suspendVendor(id, body.organizationId, reason, actor);
    return toVendorDto(vendor);
  }

  @Post(':id/blacklist')
  @RequirePermission(PERMISSIONS.VENDOR_BLACKLIST)
  async blacklistVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const { reason } = VendorStatusActionSchema.parse(body);
    const vendor = await this.vendorService.blacklistVendor(id, body.organizationId, reason, actor);
    return toVendorDto(vendor);
  }

  @Get(':id/eligibility')
  @RequirePermission(PERMISSIONS.VENDOR_VIEW)
  async checkEligibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('requiredCategoryKey') requiredCategoryKey?: string,
    @Query('requiredInventoryCategoryId') requiredInventoryCategoryId?: string,
  ) {
    return this.vendorService.checkEligibility({
      vendorId: id,
      organizationId,
      communityId,
      requiredCategoryKey,
      requiredInventoryCategoryId,
    });
  }

  @Get(':id/scorecard')
  @RequirePermission(PERMISSIONS.VENDOR_PERFORMANCE_VIEW)
  async getScorecard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const periodStart = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 86400000);
    const periodEnd = endDate ? new Date(endDate) : new Date();
    return this.vendorService.getScorecard(id, periodStart, periodEnd);
  }

  @Post(':id/documents')
  @RequirePermission(PERMISSIONS.VENDOR_DOCUMENTS_MANAGE)
  async addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    return this.vendorService.addDocument(id, body.organizationId, body, actor);
  }

  @Post(':id/ratings')
  @RequirePermission(PERMISSIONS.VENDOR_PERFORMANCE_MANAGE)
  async addRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = CreateVendorRatingSchema.parse({ ...body, vendorId: id });
    const rating = await this.vendorService.addRating(validated as any, actor);
    return toVendorRatingDto(rating);
  }
}
