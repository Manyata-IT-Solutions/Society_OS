import type { DomainEvent } from './event-envelope.js';

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export interface IEventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  publishAll(events: DomainEvent<unknown>[]): Promise<void>;
  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void;
  unsubscribe(eventName: string, handler: EventHandler<unknown>): void;
}
