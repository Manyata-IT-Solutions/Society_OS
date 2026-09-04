import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RuleDefinitionRepository } from './rule-definition.repository.js';
import { RuleEvaluatorService } from './rule-evaluator.service.js';
import { FactRegistry } from './fact-registry.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS } from '@community-os/events';
import { createEvent } from '@community-os/events';
import type {
  Actor,
  ScopeType,
  RuleStatus,
  RuleDefinition,
  ConditionNode,
  RuleEvaluationResult,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RuleService {
  constructor(
    private readonly ruleRepo: RuleDefinitionRepository,
    private readonly evaluator: RuleEvaluatorService,
    private readonly factRegistry: FactRegistry,
    private readonly eventBus: EventsService,
  ) {}

  async createDraft(
    data: {
      organizationId?: string | null;
      communityId?: string | null;
      scopeType?: 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';
      key: string;
      name: string;
      description?: string;
      resourceType: string;
      inputSchema?: Record<string, unknown>;
      conditionTree: ConditionNode;
      outputEffect?: Record<string, unknown> | null;
    },
    actor: Actor,
  ): Promise<RuleDefinition> {
    const latestVersion = await this.ruleRepo.getLatestVersionNumber(
      data.organizationId,
      data.communityId,
      data.key,
    );

    const version = latestVersion + 1;

    const created = await this.ruleRepo.create({
      key: data.key,
      name: data.name,
      description: data.description,
      version,
      scopeType: data.scopeType ?? 'PLATFORM',
      scopeId: data.communityId ?? data.organizationId ?? null,
      organization: data.organizationId ? { connect: { id: data.organizationId } } : undefined,
      community: data.communityId ? { connect: { id: data.communityId } } : undefined,
      status: 'DRAFT',
      resourceType: data.resourceType,
      inputSchema: (data.inputSchema ?? {}) as Prisma.InputJsonValue,
      conditionTree: data.conditionTree as Prisma.InputJsonValue,
      outputEffect: data.outputEffect ? (data.outputEffect as Prisma.InputJsonValue) : undefined,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapToDomain(created);
  }

  async updateDraft(
    id: string,
    data: {
      name?: string;
      description?: string;
      conditionTree?: ConditionNode;
      outputEffect?: Record<string, unknown> | null;
    },
    _actor: Actor,
  ): Promise<RuleDefinition> {
    const existing = await this.ruleRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rule definition with ID "${id}" not found`);
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        'Published or retired rules are immutable. Create a new version to modify.',
      );
    }

    const updated = await this.ruleRepo.update(id, {
      name: data.name,
      description: data.description,
      conditionTree: data.conditionTree ? (data.conditionTree as Prisma.InputJsonValue) : undefined,
      outputEffect:
        data.outputEffect !== undefined ? (data.outputEffect as Prisma.InputJsonValue) : undefined,
    });

    return this.mapToDomain(updated);
  }

  async publish(id: string, actor: Actor): Promise<RuleDefinition> {
    const existing = await this.ruleRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rule definition with ID "${id}" not found`);
    }

    if (existing.status === 'PUBLISHED') {
      return this.mapToDomain(existing);
    }
    if (existing.status === 'RETIRED') {
      throw new BadRequestException('Cannot publish a retired rule definition');
    }

    const updated = await this.ruleRepo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.RULE_PUBLISHED,
        {
          ruleDefinitionId: updated.id,
          key: updated.key,
          version: updated.version,
          resourceType: updated.resourceType,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
          userId: actor.id,
        },
      ),
    );

    return this.mapToDomain(updated);
  }

  async retire(id: string, _actor: Actor): Promise<RuleDefinition> {
    const existing = await this.ruleRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rule definition with ID "${id}" not found`);
    }

    const updated = await this.ruleRepo.update(id, {
      status: 'RETIRED',
    });

    return this.mapToDomain(updated);
  }

  async cloneNewVersion(id: string, actor: Actor): Promise<RuleDefinition> {
    const existing = await this.ruleRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rule definition with ID "${id}" not found`);
    }

    const latestVersion = await this.ruleRepo.getLatestVersionNumber(
      existing.organizationId,
      existing.communityId,
      existing.key,
    );

    const created = await this.ruleRepo.create({
      key: existing.key,
      name: existing.name,
      description: existing.description,
      version: latestVersion + 1,
      scopeType: existing.scopeType,
      scopeId: existing.scopeId,
      organization: existing.organizationId
        ? { connect: { id: existing.organizationId } }
        : undefined,
      community: existing.communityId ? { connect: { id: existing.communityId } } : undefined,
      status: 'DRAFT',
      resourceType: existing.resourceType,
      inputSchema: existing.inputSchema as Prisma.InputJsonValue,
      conditionTree: existing.conditionTree as Prisma.InputJsonValue,
      outputEffect: existing.outputEffect
        ? (existing.outputEffect as Prisma.InputJsonValue)
        : undefined,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapToDomain(created);
  }

  async getById(id: string): Promise<RuleDefinition> {
    const record = await this.ruleRepo.findById(id);
    if (!record) {
      throw new NotFoundException(`Rule definition with ID "${id}" not found`);
    }
    return this.mapToDomain(record);
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: RuleDefinition[]; total: number }> {
    const result = await this.ruleRepo.list(params);
    return {
      items: result.items.map((i) => this.mapToDomain(i)),
      total: result.total,
    };
  }

  /**
   * Evaluates a rule definition against a facts payload.
   */
  async evaluateRule(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
    version: number | undefined,
    facts: Record<string, unknown>,
  ): Promise<RuleEvaluationResult> {
    let definition;
    if (version) {
      definition = await this.ruleRepo.findByKeyAndVersion(
        organizationId,
        communityId,
        key,
        version,
      );
    } else {
      definition = await this.ruleRepo.findLatestPublished(organizationId, communityId, key);
    }

    if (!definition) {
      throw new NotFoundException(`Rule "${key}" (version: ${version ?? 'latest'}) not found`);
    }

    return this.evaluator.evaluate(
      definition.key,
      definition.version,
      definition.conditionTree as unknown as ConditionNode,
      facts,
      definition.outputEffect as Record<string, unknown> | null,
    );
  }

  /**
   * Dry-run simulation of a rule without persisting anything.
   */
  async simulate(
    ruleIdOrCondition: { ruleId?: string; conditionTree?: ConditionNode },
    facts: Record<string, unknown>,
  ): Promise<RuleEvaluationResult> {
    let conditionTree: ConditionNode;
    let ruleKey = 'simulation.dry_run';
    let version = 1;
    let outputEffect: Record<string, unknown> | null = null;

    if (ruleIdOrCondition.ruleId) {
      const def = await this.ruleRepo.findById(ruleIdOrCondition.ruleId);
      if (!def) {
        throw new NotFoundException(
          `Rule definition with ID "${ruleIdOrCondition.ruleId}" not found`,
        );
      }
      conditionTree = def.conditionTree as unknown as ConditionNode;
      ruleKey = def.key;
      version = def.version;
      outputEffect = def.outputEffect as Record<string, unknown> | null;
    } else if (ruleIdOrCondition.conditionTree) {
      conditionTree = ruleIdOrCondition.conditionTree;
    } else {
      throw new BadRequestException(
        'Either ruleId or conditionTree must be supplied for simulation',
      );
    }

    return this.evaluator.evaluate(ruleKey, version, conditionTree, facts, outputEffect);
  }

  private mapToDomain(record: Record<string, unknown>): RuleDefinition {
    return {
      id: record.id as string,
      key: record.key as string,
      name: record.name as string,
      description: record.description as string | null,
      version: record.version as number,
      scopeType: record.scopeType as ScopeType,
      scopeId: record.scopeId as string | null,
      organizationId: record.organizationId as string | null,
      communityId: record.communityId as string | null,
      status: record.status as RuleStatus,
      resourceType: record.resourceType as string,
      inputSchema: (record.inputSchema ?? {}) as Record<string, unknown>,
      conditionTree: record.conditionTree as unknown as ConditionNode,
      outputEffect: record.outputEffect as Record<string, unknown> | null,
      createdById: record.createdById as string | null,
      publishedAt: record.publishedAt as Date | null,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date,
    };
  }
}
