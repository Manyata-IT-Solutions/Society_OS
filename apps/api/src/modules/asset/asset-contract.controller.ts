import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, AssetServiceContract, ServiceContractType } from '@community-os/types';
import {
  createAssetServiceContractSchema,
  linkAssetServiceContractSchema,
} from '@community-os/validation';
import {
  toAssetServiceContractDto,
  type AssetServiceContractResponseDto,
} from '@community-os/contracts';
import { AssetContractService } from './asset-contract.service.js';

@Controller('asset-contracts')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetContractController {
  constructor(private readonly service: AssetContractService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_CONTRACT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createContract(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetServiceContractResponseDto> {
    const parsed = createAssetServiceContractSchema.parse(body);
    const contract = await this.service.createContract(parsed, actor);
    return toAssetServiceContractDto(contract);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ASSET_CONTRACT_VIEW)
  async listContracts(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED',
    @Query('contractType') contractType?: ServiceContractType,
    @Query('search') search?: string,
  ): Promise<AssetServiceContractResponseDto[]> {
    const contracts = await this.service.listContracts({
      organizationId,
      communityId,
      status,
      contractType,
      search,
    });
    return contracts.map((c) =>
      toAssetServiceContractDto(c, {
        coveredAssetsCount: (c as AssetServiceContract & { coveredAssets?: unknown[] })
          .coveredAssets?.length,
      }),
    );
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_CONTRACT_VIEW)
  async getContractById(@Param('id') id: string): Promise<AssetServiceContractResponseDto> {
    const contract = await this.service.getContractById(id);
    return toAssetServiceContractDto(contract, {
      coveredAssetsCount: (contract as AssetServiceContract & { coveredAssets?: unknown[] })
        .coveredAssets?.length,
    });
  }

  @Post(':id/link-assets')
  @RequirePermission(PERMISSIONS.ASSET_CONTRACT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async linkAssets(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ success: boolean }> {
    const parsed = linkAssetServiceContractSchema.parse(body);
    await this.service.linkAssetsToContract(id, parsed.assetIds, parsed.notes ?? null, actor);
    return { success: true };
  }

  @Delete(':id/unlink-asset/:assetId')
  @RequirePermission(PERMISSIONS.ASSET_CONTRACT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async unlinkAsset(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ success: boolean }> {
    await this.service.unlinkAssetFromContract(id, assetId, actor);
    return { success: true };
  }
}
