import { randomUUID } from 'node:crypto';

/**
 * OpenTelemetry and Distributed Tracing Header Constants
 */
export const TRACE_HEADERS = {
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  ORGANIZATION_ID: 'x-organization-id',
  COMMUNITY_ID: 'x-community-id',
  TRACEPARENT: 'traceparent',
  TRACESTATE: 'tracestate',
} as const;

export function generateTraceId(): string {
  return randomUUID();
}

export function generateCorrelationId(): string {
  return randomUUID();
}
