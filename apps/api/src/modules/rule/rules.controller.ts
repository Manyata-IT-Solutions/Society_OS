import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RuleService } from './rule.service.js';
import { FactRegistry } from './fact-registry.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateRuleDefinitionSchema,
  UpdateRuleDefinitionSchema,
  SimulateRuleSchema,
} from '@community-os/validation';
import {
  toRuleDefinitionDto,
  toRuleSimulationResultDto,
  type RuleDefinitionResponseDto,
  type RuleSimulationResultDto,
} from '@community-os/contracts';

@Controller('rules')
@UseGuards(AuthGuard, PermissionGuard)
export class RulesController {
  constructor(
    private readonly ruleService: RuleService,
    private readonly factRegistry: FactRegistry,
  ) {}

  @Get('definitions')
  @RequirePermission(PERMISSIONS.RULE_VIEW)
  async listDefinitions(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: RuleDefinitionResponseDto[]; total: number }> {
    const result = await this.ruleService.list({
      organizationId,
      communityId,
      resourceType,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });

    return {
      items: result.items.map(toRuleDefinitionDto),
      total: result.total,
    };
  }

  @Get('definitions/:id')
  @RequirePermission(PERMISSIONS.RULE_VIEW)
  async getDefinition(@Param('id') id: string): Promise<RuleDefinitionResponseDto> {
    const def = await this.ruleService.getById(id);
    return toRuleDefinitionDto(def);
  }

  @Post('definitions')
  @RequirePermission(PERMISSIONS.RULE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createDefinition(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<RuleDefinitionResponseDto> {
    const parsed = CreateRuleDefinitionSchema.parse(body);
    const created = await this.ruleService.createDraft(
      parsed as unknown as Parameters<typeof this.ruleService.createDraft>[0],
      actor,
    );
    return toRuleDefinitionDto(created);
  }

  @Put('definitions/:id')
  @RequirePermission(PERMISSIONS.RULE_MANAGE)
  async updateDefinition(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<RuleDefinitionResponseDto> {
    const parsed = UpdateRuleDefinitionSchema.parse(body);
    const updated = await this.ruleService.updateDraft(
      id,
      parsed as unknown as Parameters<typeof this.ruleService.updateDraft>[1],
      actor,
    );
    return toRuleDefinitionDto(updated);
  }

  @Post('definitions/:id/publish')
  @RequirePermission(PERMISSIONS.RULE_PUBLISH)
  @HttpCode(HttpStatus.OK)
  async publishDefinition(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<RuleDefinitionResponseDto> {
    const published = await this.ruleService.publish(id, actor);
    return toRuleDefinitionDto(published);
  }

  @Post('definitions/:id/retire')
  @RequirePermission(PERMISSIONS.RULE_MANAGE)
  @HttpCode(HttpStatus.OK)
  async retireDefinition(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<RuleDefinitionResponseDto> {
    const retired = await this.ruleService.retire(id, actor);
    return toRuleDefinitionDto(retired);
  }

  @Post('definitions/:id/clone')
  @RequirePermission(PERMISSIONS.RULE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async cloneDefinition(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<RuleDefinitionResponseDto> {
    const cloned = await this.ruleService.cloneNewVersion(id, actor);
    return toRuleDefinitionDto(cloned);
  }

  @Post('simulate')
  @RequirePermission(PERMISSIONS.RULE_VIEW)
  @HttpCode(HttpStatus.OK)
  async simulateRule(
    @Body() body: unknown,
    @Query('ruleId') ruleId?: string,
  ): Promise<RuleSimulationResultDto> {
    const parsed = SimulateRuleSchema.parse(body);
    const result = await this.ruleService.simulate(
      {
        ruleId,
        conditionTree: parsed.conditionTree as unknown as Parameters<
          typeof this.ruleService.simulate
        >[0]['conditionTree'],
      },
      parsed.facts,
    );
    return toRuleSimulationResultDto(result);
  }

  @Get('facts')
  @RequirePermission(PERMISSIONS.RULE_VIEW)
  async listFacts(@Query('resourceType') resourceType?: string) {
    return {
      items: this.factRegistry.listFacts(resourceType),
    };
  }
}
