import { Injectable, HttpStatus } from '@nestjs/common';
import { AuditRepository, type CreateAuditRecordInput } from './audit.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { AuditRecord, AuditQueryFilters, Actor } from '@community-os/types';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'refreshtoken',
  'refresh_token',
  'token',
  'accesstoken',
  'access_token',
  'otp',
  'secret',
  'secretkey',
  'secret_key',
  'apikey',
  'api_key',
  'cardnumber',
  'card_number',
  'cvv',
  'cvc',
  'authorization',
]);

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepo: AuditRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Centralized method to record an immutable audit record.
   */
  async record(input: CreateAuditRecordInput): Promise<AuditRecord> {
    const sanitizedMetadata = this.redactSensitiveData(input.metadata || {});
    const sanitizedBefore = input.beforeSnapshot
      ? this.redactSensitiveData(input.beforeSnapshot)
      : null;
    const sanitizedAfter = input.afterSnapshot
      ? this.redactSensitiveData(input.afterSnapshot)
      : null;
    const sanitizedChanges = input.changes ? this.redactChanges(input.changes) : null;

    const record = await this.auditRepo.create({
      ...input,
      metadata: sanitizedMetadata,
      beforeSnapshot: sanitizedBefore,
      afterSnapshot: sanitizedAfter,
      changes: sanitizedChanges,
    });

    this.logger.debug(
      `Recorded audit record: ${record.action} on ${record.resourceType}:${record.resourceId || 'N/A'} (actor: ${record.actorType}:${record.actorId || 'N/A'})`,
      'AuditService',
    );

    try {
      await this.eventsService.publish(
        createEvent(DOMAIN_EVENT_NAMES.AUDIT_RECORDED, {
          auditId: record.id,
          action: record.action,
          resourceType: record.resourceType,
          resourceId: record.resourceId,
          actorId: record.actorId,
          occurredAt: record.occurredAt.toISOString(),
        }),
      );
    } catch (err) {
      this.logger.warn(`Failed to publish audit event: ${(err as Error).message}`, 'AuditService');
    }

    return record;
  }

  /**
   * Find audit record by ID.
   */
  async getAuditRecordById(id: string, _actor: Actor): Promise<AuditRecord> {
    const record = await this.auditRepo.findById(id);
    if (!record) {
      throw new DomainException(
        'AUDIT_RECORD_NOT_FOUND',
        `Audit record ${id} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return record;
  }

  /**
   * List audit records with authorized filters.
   */
  async listAuditRecords(
    filters: AuditQueryFilters,
    _actor: Actor,
  ): Promise<{ items: AuditRecord[]; total: number; page: number; limit: number }> {
    return this.auditRepo.findMany(filters);
  }

  /**
   * Export audit records to CSV with formula injection defense.
   */
  async exportAuditCsv(filters: AuditQueryFilters, _actor: Actor): Promise<string> {
    const effectiveFilters = { ...filters, page: 1, limit: 10000 };
    const { items } = await this.auditRepo.findMany(effectiveFilters);

    const headers = [
      'Record ID',
      'Occurred At (UTC)',
      'Actor Type',
      'Actor ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'Result',
      'Classification',
      'Retention Category',
      'Source',
      'Request ID',
      'Reason',
    ];

    const sanitize = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (
        str.startsWith('=') ||
        str.startsWith('+') ||
        str.startsWith('-') ||
        str.startsWith('@')
      ) {
        str = `'${str}`;
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = items.map((r) => [
      sanitize(r.id),
      sanitize(r.occurredAt.toISOString()),
      sanitize(r.actorType),
      sanitize(r.actorId),
      sanitize(r.action),
      sanitize(r.resourceType),
      sanitize(r.resourceId),
      sanitize(r.result),
      sanitize(r.classification),
      sanitize(r.retentionCategory),
      sanitize(r.source),
      sanitize(r.requestId),
      sanitize(r.reason),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  }

  /**
   * Deeply redact sensitive attributes from arbitrary JSON objects.
   */
  redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') return obj;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item && typeof item === 'object'
            ? this.redactSensitiveData(item as Record<string, unknown>)
            : item,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Redact sensitive fields within change diff records.
   */
  private redactChanges(
    changes: Record<string, { before: unknown; after: unknown }>,
  ): Record<string, { before: unknown; after: unknown }> {
    const result: Record<string, { before: unknown; after: unknown }> = {};
    for (const [key, change] of Object.entries(changes)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = { before: '[REDACTED]', after: '[REDACTED]' };
      } else {
        result[key] = change;
      }
    }
    return result;
  }
}
