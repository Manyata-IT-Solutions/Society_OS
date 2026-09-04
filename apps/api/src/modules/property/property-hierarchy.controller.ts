import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { PropertyTreeResponseDto } from '@community-os/contracts';

@ApiTags('Property - Hierarchy')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('communities/:communityId/property-tree')
export class PropertyHierarchyController {
  constructor(private readonly hierarchyService: PropertyHierarchyService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COMMUNITY_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Get full property hierarchy tree for visual explorer' })
  async getTree(@Param('communityId') communityId: string): Promise<PropertyTreeResponseDto> {
    const root = await this.hierarchyService.getPropertyTree(communityId);
    return { root };
  }
}
