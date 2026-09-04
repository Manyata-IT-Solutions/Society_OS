import type { FeatureDefinition } from '@community-os/types';

export class FeatureRegistry {
  private static readonly REGISTRY: Map<string, FeatureDefinition> = new Map();

  static {
    this.register({
      key: 'feature.documentLibrary',
      name: 'Document Management Library',
      description: 'Enables central document repository, versioning, and resource attachment links',
      category: 'Platform Core',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      rolloutType: 'BOOLEAN_TOGGLE',
      isClientSafe: true,
    });

    this.register({
      key: 'feature.inAppNotifications',
      name: 'In-App Notification Center',
      description: 'Enables real-time in-app notification inbox, badges, and read-status tracking',
      category: 'Notifications',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      rolloutType: 'BOOLEAN_TOGGLE',
      isClientSafe: true,
    });

    this.register({
      key: 'feature.residentAccountInvites',
      name: 'Resident Portal Self-Service Invitations',
      description: 'Allows community managers to issue portal activation invitations to residents',
      category: 'Resident Management',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      rolloutType: 'BOOLEAN_TOGGLE',
      dependencies: ['feature.inAppNotifications'],
      isClientSafe: true,
    });

    this.register({
      key: 'feature.propertyBulkImport',
      name: 'Property Bulk CSV Ingestion',
      description: 'Enables bulk asynchronous property and unit CSV imports with validation stages',
      category: 'Property Hierarchy',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION'],
      rolloutType: 'BOOLEAN_TOGGLE',
      isClientSafe: true,
    });

    this.register({
      key: 'feature.customFields',
      name: 'Custom Fields & Dynamic Metadata',
      description:
        'Enables tenant-defined custom metadata fields on Units, Buildings, and Residents',
      category: 'Extensibility',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      rolloutType: 'BOOLEAN_TOGGLE',
      isClientSafe: true,
    });

    this.register({
      key: 'feature.auditExport',
      name: 'Audit Trail CSV Export',
      description: 'Enables sanitized CSV export of immutable audit trail records',
      category: 'Audit & Compliance',
      defaultEnabled: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION'],
      rolloutType: 'BOOLEAN_TOGGLE',
      isClientSafe: true,
    });
  }

  private static register(definition: FeatureDefinition): void {
    this.REGISTRY.set(definition.key, definition);
  }

  static getDefinitions(): FeatureDefinition[] {
    return Array.from(this.REGISTRY.values());
  }

  static getDefinition(key: string): FeatureDefinition | null {
    return this.REGISTRY.get(key) || null;
  }
}
