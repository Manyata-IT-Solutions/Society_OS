import { Injectable } from '@nestjs/common';
import {
  InMemoryEventBus,
  type DomainEvent,
  type EventHandler,
  type IEventBus,
} from '@community-os/events';
import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class EventsService implements IEventBus {
  private readonly eventBus = new InMemoryEventBus();

  constructor(private readonly logger: LoggerService) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    this.logger.debug(
      `Publishing domain event: ${event.metadata.eventName} (${event.metadata.eventId})`,
      'EventsService',
    );
    await this.eventBus.publish(event);
  }

  async publishAll(events: DomainEvent<unknown>[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    return this.eventBus.subscribe(eventName, handler);
  }

  unsubscribe(eventName: string, handler: EventHandler<unknown>): void {
    this.eventBus.unsubscribe(eventName, handler);
  }
}
