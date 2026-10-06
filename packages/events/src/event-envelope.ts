import { randomUUID } from 'node:crypto';

/**
 * Standard Envelope for Domain and Integration Events
 */
export interface EventMetadata {
  eventId: string;
  eventName: string;
  version: number;
  timestamp: string;
  correlationId: string;
  causationId?: string;
  organizationId?: string;
  communityId?: string;
  userId?: string;
}

export interface DomainEvent<T = unknown> {
  metadata: EventMetadata;
  payload: T;
}

export function createEvent<T>(
  eventName: string,
  payload: T,
  options: {
    version?: number;
    correlationId?: string;
    causationId?: string;
    organizationId?: string;
    communityId?: string;
    userId?: string;
  } = {},
): DomainEvent<T> {
  return {
    metadata: {
      eventId: randomUUID(),
      eventName,
      version: options.version ?? 1,
      timestamp: new Date().toISOString(),
      correlationId: options.correlationId ?? randomUUID(),
      causationId: options.causationId,
      organizationId: options.organizationId,
      communityId: options.communityId,
      userId: options.userId,
    },
    payload,
  };
}
