import type { DomainEvent } from './event-envelope.js';
import type { EventHandler, IEventBus } from './event-bus.interface.js';

export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler<unknown>>>();

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.metadata.eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event as DomainEvent<unknown>);
      } catch (err) {
        // Event handlers should not crash the publisher in in-memory mode
        // Future: route to dead-letter queue or retry mechanism
        // eslint-disable-next-line no-console
        console.error(
          `[EventBus] Error executing handler for event ${event.metadata.eventName}:`,
          err,
        );
      }
    });

    await Promise.all(promises);
  }

  async publishAll(events: DomainEvent<unknown>[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;
    handlers.add(handler as EventHandler<unknown>);

    return () => {
      this.unsubscribe(eventName, handler as EventHandler<unknown>);
    };
  }

  unsubscribe(eventName: string, handler: EventHandler<unknown>): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
