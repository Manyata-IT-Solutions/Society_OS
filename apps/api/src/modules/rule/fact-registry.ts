import { Injectable } from '@nestjs/common';

export interface RegisteredFact {
  path: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ARRAY' | 'OBJECT';
  description: string;
  resourceTypes: string[];
}

@Injectable()
export class FactRegistry {
  private readonly facts = new Map<string, RegisteredFact>();

  constructor() {
    this.registerDefaults();
  }

  registerFact(fact: RegisteredFact): void {
    this.facts.set(fact.path, fact);
  }

  getFact(path: string): RegisteredFact | undefined {
    return this.facts.get(path);
  }

  listFacts(resourceType?: string): RegisteredFact[] {
    const all = Array.from(this.facts.values());
    if (!resourceType) return all;
    return all.filter(
      (f) => f.resourceTypes.includes(resourceType) || f.resourceTypes.includes('*'),
    );
  }

  isFactRegistered(path: string): boolean {
    return this.facts.has(path);
  }

  private registerDefaults(): void {
    // Resource facts
    this.registerFact({
      path: 'resource.amount',
      type: 'NUMBER',
      description: 'Monetary amount or numeric value of the resource',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'resource.priority',
      type: 'STRING',
      description: 'Priority level (LOW, MEDIUM, HIGH, URGENT, CRITICAL)',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'resource.category',
      type: 'STRING',
      description: 'Classification category of the resource',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'resource.status',
      type: 'STRING',
      description: 'Current business status of the resource',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'resource.documentCount',
      type: 'NUMBER',
      description: 'Number of attached or related documents',
      resourceTypes: ['*'],
    });

    // Actor facts
    this.registerFact({
      path: 'actor.isPlatformAdmin',
      type: 'BOOLEAN',
      description: 'Whether the acting user is a platform administrator',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'actor.roles',
      type: 'ARRAY',
      description: 'List of role codes assigned to the acting user',
      resourceTypes: ['*'],
    });

    this.registerFact({
      path: 'actor.permissions',
      type: 'ARRAY',
      description: 'List of permission codes possessed by the acting user',
      resourceTypes: ['*'],
    });

    // Workflow state facts
    this.registerFact({
      path: 'workflow.currentState',
      type: 'STRING',
      description: 'Current active state key of the workflow instance',
      resourceTypes: ['*'],
    });

    // Facility & Work Order facts (Phase 9)
    this.registerFact({
      path: 'workOrder.type',
      type: 'STRING',
      description:
        'Work order type (CORRECTIVE, PREVENTIVE, INSPECTION, ROUTINE, EMERGENCY, OTHER)',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.priority',
      type: 'STRING',
      description: 'Work order priority (LOW, NORMAL, HIGH, URGENT, CRITICAL)',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.categoryKey',
      type: 'STRING',
      description: 'Facility work category key',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.locationType',
      type: 'STRING',
      description:
        'Work order location type (COMMUNITY, SECTION, BUILDING, FLOOR, UNIT, COMMON_AREA, OTHER)',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.source',
      type: 'STRING',
      description: 'Originating source of the work order',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.isTicketLinked',
      type: 'BOOLEAN',
      description: 'Whether the work order is linked to one or more helpdesk tickets',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'workOrder.reworkCount',
      type: 'NUMBER',
      description: 'Number of supervisor rework loops requested on the work order',
      resourceTypes: ['WORK_ORDER', '*'],
    });

    // Asset facts (Phase 10)
    this.registerFact({
      path: 'asset.categoryCode',
      type: 'STRING',
      description: 'Asset category code',
      resourceTypes: ['ASSET', 'WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'asset.criticality',
      type: 'STRING',
      description: 'Asset criticality level (LOW, MEDIUM, HIGH, CRITICAL)',
      resourceTypes: ['ASSET', 'WORK_ORDER', '*'],
    });

    this.registerFact({
      path: 'asset.lifecycleState',
      type: 'STRING',
      description:
        'Asset lifecycle state (REGISTERED, INSTALLED, COMMISSIONED, ACTIVE, SUSPENDED, DECOMMISSIONED, DISPOSED)',
      resourceTypes: ['ASSET', '*'],
    });

    this.registerFact({
      path: 'asset.operationalStatus',
      type: 'STRING',
      description:
        'Asset operational status (OPERATIONAL, DEGRADED, OUT_OF_SERVICE, UNDER_MAINTENANCE, UNKNOWN)',
      resourceTypes: ['ASSET', '*'],
    });

    this.registerFact({
      path: 'asset.condition',
      type: 'STRING',
      description: 'Asset physical condition (GOOD, FAIR, POOR, CRITICAL, UNKNOWN)',
      resourceTypes: ['ASSET', '*'],
    });

    this.registerFact({
      path: 'asset.isUnderWarranty',
      type: 'BOOLEAN',
      description: 'Whether the asset currently has an active warranty',
      resourceTypes: ['ASSET', '*'],
    });

    this.registerFact({
      path: 'asset.isUnderContract',
      type: 'BOOLEAN',
      description: 'Whether the asset is covered by an active AMC/service contract',
      resourceTypes: ['ASSET', '*'],
    });
  }
}
