import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../events/events.service.js';
import { AuditService } from './audit.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES } from '@community-os/events';
import type { DomainEvent } from '@community-os/events';

@Injectable()
export class AuditEventSubscriberService implements OnModuleInit {
  constructor(
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit(): void {
    this.subscribeToDomainEvents();
  }

  private subscribeToDomainEvents(): void {
    const auditedEvents = [
      DOMAIN_EVENT_NAMES.ORGANIZATION_CREATED,
      DOMAIN_EVENT_NAMES.ORGANIZATION_UPDATED,
      DOMAIN_EVENT_NAMES.ORGANIZATION_STATUS_CHANGED,
      DOMAIN_EVENT_NAMES.COMMUNITY_CREATED,
      DOMAIN_EVENT_NAMES.COMMUNITY_UPDATED,
      DOMAIN_EVENT_NAMES.COMMUNITY_STATUS_CHANGED,
      DOMAIN_EVENT_NAMES.USER_CREATED,
      DOMAIN_EVENT_NAMES.USER_UPDATED,
      DOMAIN_EVENT_NAMES.USER_STATUS_CHANGED,
      DOMAIN_EVENT_NAMES.SESSION_CREATED,
      DOMAIN_EVENT_NAMES.SESSION_REVOKED,
      DOMAIN_EVENT_NAMES.ROLE_CREATED,
      DOMAIN_EVENT_NAMES.ROLE_UPDATED,
      DOMAIN_EVENT_NAMES.ROLE_ASSIGNMENT_CREATED,
      DOMAIN_EVENT_NAMES.ROLE_ASSIGNMENT_REVOKED,
      DOMAIN_EVENT_NAMES.RESIDENT_CREATED,
      DOMAIN_EVENT_NAMES.RESIDENT_UPDATED,
      DOMAIN_EVENT_NAMES.RESIDENT_INVITED,
      DOMAIN_EVENT_NAMES.RESIDENT_USER_LINKED,
      DOMAIN_EVENT_NAMES.HOUSEHOLD_CREATED,
      DOMAIN_EVENT_NAMES.HOUSEHOLD_MEMBER_ADDED,
      DOMAIN_EVENT_NAMES.OWNERSHIP_STARTED,
      DOMAIN_EVENT_NAMES.OWNERSHIP_TRANSFERRED,
      DOMAIN_EVENT_NAMES.UNIT_MOVE_IN_COMPLETED,
      DOMAIN_EVENT_NAMES.UNIT_MOVE_OUT_COMPLETED,
      DOMAIN_EVENT_NAMES.DOCUMENT_CREATED,
      DOMAIN_EVENT_NAMES.DOCUMENT_VERSION_UPLOADED,
      DOMAIN_EVENT_NAMES.DOCUMENT_ARCHIVED,
      DOMAIN_EVENT_NAMES.DOCUMENT_LINKED,
      DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_CREATED,
      DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_UPDATED,
      DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_REMOVED,
      DOMAIN_EVENT_NAMES.FEATURE_OVERRIDE_CHANGED,
      DOMAIN_EVENT_NAMES.CUSTOM_FIELD_CREATED,
      DOMAIN_EVENT_NAMES.CUSTOM_FIELD_UPDATED,
      DOMAIN_EVENT_NAMES.CUSTOM_FIELD_ARCHIVED,
      DOMAIN_EVENT_NAMES.CUSTOM_FIELD_VALUE_UPDATED,
      DOMAIN_EVENT_NAMES.DISPLAY_SETTING_CHANGED,
      // Phase 11 Inventory Events
      DOMAIN_EVENT_NAMES.INVENTORY_ITEM_CREATED,
      DOMAIN_EVENT_NAMES.INVENTORY_ITEM_UPDATED,
      DOMAIN_EVENT_NAMES.INVENTORY_RECEIPT_POSTED,
      DOMAIN_EVENT_NAMES.INVENTORY_RECEIPT_REVERSED,
      DOMAIN_EVENT_NAMES.INVENTORY_STOCK_ISSUED,
      DOMAIN_EVENT_NAMES.INVENTORY_STOCK_RETURNED,
      DOMAIN_EVENT_NAMES.INVENTORY_STOCK_TRANSFERRED,
      DOMAIN_EVENT_NAMES.INVENTORY_STOCK_ADJUSTED,
      DOMAIN_EVENT_NAMES.INVENTORY_RESERVATION_CREATED,
      DOMAIN_EVENT_NAMES.INVENTORY_RESERVATION_RELEASED,
      DOMAIN_EVENT_NAMES.INVENTORY_MATERIAL_CONSUMED,
      DOMAIN_EVENT_NAMES.INVENTORY_STOCK_COUNT_POSTED,
      DOMAIN_EVENT_NAMES.WORK_ORDER_MATERIAL_REQUESTED,
      DOMAIN_EVENT_NAMES.WORK_ORDER_MATERIAL_CONSUMED,
    ];

    for (const eventName of auditedEvents) {
      this.eventsService.subscribe(eventName, async (event: DomainEvent) => {
        try {
          await this.handleEvent(event);
        } catch (err) {
          this.logger.error(
            `Error processing audit projection for ${event.metadata.eventName}: ${(err as Error).message}`,
            (err as Error).stack,
            'AuditEventSubscriber',
          );
        }
      });
    }

    this.logger.log(
      `Registered audit projection for ${auditedEvents.length} domain event types`,
      'AuditEventSubscriber',
    );
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const payload = (event.payload || {}) as Record<string, unknown>;
    const metadata = event.metadata || {};

    const [resourceType, actionName] = (metadata.eventName || '').split('.');
    const action = `${resourceType}.${actionName}`;

    const resourceId =
      (payload['id'] as string) ||
      (payload[`${resourceType}Id`] as string) ||
      (payload['unitId'] as string) ||
      (payload['residentId'] as string) ||
      (payload['userId'] as string) ||
      null;

    await this.auditService.record({
      organizationId: metadata.organizationId || (payload['organizationId'] as string) || null,
      communityId: metadata.communityId || (payload['communityId'] as string) || null,
      actorType: metadata.userId ? 'USER' : 'SYSTEM',
      actorId: metadata.userId || (payload['createdById'] as string) || null,
      action,
      resourceType: resourceType || 'unknown',
      resourceId: resourceId ? String(resourceId) : null,
      resourceScope: metadata.communityId
        ? 'COMMUNITY'
        : metadata.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      result: 'SUCCESS',
      requestId: null,
      correlationId: metadata.correlationId || null,
      occurredAt: new Date(metadata.timestamp),
      source: 'event_bus',
      metadata: payload,
      classification: 'INTERNAL',
      retentionCategory: this.resolveRetentionCategory(resourceType || ''),
    });
  }

  private resolveRetentionCategory(
    resourceType: string,
  ): 'SECURITY' | 'FINANCIAL' | 'GOVERNANCE' | 'OPERATIONAL' | 'SYSTEM' {
    if (['user', 'session', 'role', 'role_assignment'].includes(resourceType)) {
      return 'SECURITY';
    }
    if (['organization', 'community', 'document'].includes(resourceType)) {
      return 'GOVERNANCE';
    }
    return 'OPERATIONAL';
  }
}
