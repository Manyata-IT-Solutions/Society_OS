import { Injectable } from '@nestjs/common';

export interface WorkflowResourceTypeRegistration {
  type: string;
  name: string;
  description: string;
  supportedActions: string[];
}

@Injectable()
export class WorkflowRegistry {
  private readonly resourceTypes = new Map<string, WorkflowResourceTypeRegistration>();

  constructor() {
    this.registerDefaults();
  }

  registerResourceType(registration: WorkflowResourceTypeRegistration): void {
    this.resourceTypes.set(registration.type, registration);
  }

  getResourceType(type: string): WorkflowResourceTypeRegistration | undefined {
    return this.resourceTypes.get(type);
  }

  listResourceTypes(): WorkflowResourceTypeRegistration[] {
    return Array.from(this.resourceTypes.values());
  }

  isResourceTypeAllowed(type: string): boolean {
    return this.resourceTypes.has(type) || type === 'TEST_RESOURCE';
  }

  private registerDefaults(): void {
    this.registerResourceType({
      type: 'TEST_RESOURCE',
      name: 'Test Resource',
      description: 'Platform verification test resource',
      supportedActions: ['submit', 'approve', 'reject', 'complete', 'cancel'],
    });

    this.registerResourceType({
      type: 'DOCUMENT',
      name: 'Document',
      description: 'Platform document entity lifecycle',
      supportedActions: ['submit_review', 'approve', 'reject', 'publish', 'archive'],
    });

    this.registerResourceType({
      type: 'PROPERTY_UNIT',
      name: 'Property Unit',
      description: 'Unit status changes and handover',
      supportedActions: ['request_handover', 'inspect', 'approve_handover', 'reject_handover'],
    });

    this.registerResourceType({
      type: 'RESIDENT_ONBOARDING',
      name: 'Resident Onboarding',
      description: 'Resident registration and verification workflow',
      supportedActions: ['verify_documents', 'approve_membership', 'reject_membership'],
    });
  }
}
