import { AuditService } from './audit.service.js';
import type { AuditRepository } from './audit.repository.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import type { Actor } from '@community-os/types';

describe('AuditService (Unit)', () => {
  let service: AuditService;
  let mockAuditRepo: AuditRepository;
  let mockEventsService: EventsService;
  let mockLogger: LoggerService;

  const mockActor: Actor = {
    id: 'user-123',
    email: 'admin@communityos.io',
    displayName: 'Admin User',
    isPlatformAdmin: true,
    sessionId: 'session-123',
  };

  beforeEach(() => {
    mockAuditRepo = {
      create: jest.fn().mockImplementation(async (data) => ({
        id: 'audit-rec-1',
        occurredAt: new Date(),
        ...data,
      })),
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'audit-rec-1',
            occurredAt: new Date('2026-09-01T12:00:00Z'),
            actorType: 'USER',
            actorId: 'user-123',
            action: 'unit.move_in',
            resourceType: 'unit',
            resourceId: 'unit-101',
            result: 'SUCCESS',
            classification: 'INTERNAL',
            retentionCategory: 'OPERATIONAL',
            source: 'api',
            requestId: 'req-1',
            reason: '=2+5',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }),
    } as unknown as AuditRepository;

    mockEventsService = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventsService;

    mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerService;

    service = new AuditService(mockAuditRepo, mockEventsService, mockLogger);
  });

  describe('Sensitive Data Redaction', () => {
    it('should deeply redact password, tokens, OTPs, and secrets in metadata', async () => {
      const input = {
        actorType: 'USER' as const,
        actorId: 'user-123',
        action: 'user.login',
        resourceType: 'user',
        resourceId: 'user-123',
        metadata: {
          email: 'test@communityos.io',
          password: 'SecretPassword123!',
          refreshToken: 'xyz-refresh-token',
          nested: {
            otp: '123456',
            apiKey: 'sk_live_secret123',
            publicInfo: 'visible',
          },
        },
      };

      await service.record(input);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            email: 'test@communityos.io',
            password: '[REDACTED]',
            refreshToken: '[REDACTED]',
            nested: {
              otp: '[REDACTED]',
              apiKey: '[REDACTED]',
              publicInfo: 'visible',
            },
          },
        }),
      );
    });

    it('should redact sensitive fields in before/after snapshots and diffs', async () => {
      const input = {
        actorType: 'USER' as const,
        action: 'user.password_change',
        resourceType: 'user',
        resourceId: 'user-123',
        beforeSnapshot: { passwordHash: '$2a$12$oldhash', displayName: 'John' },
        afterSnapshot: { passwordHash: '$2a$12$newhash', displayName: 'John Doe' },
        changes: {
          passwordHash: { before: '$2a$12$oldhash', after: '$2a$12$newhash' },
          displayName: { before: 'John', after: 'John Doe' },
        },
      };

      await service.record(input);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeSnapshot: { passwordHash: '[REDACTED]', displayName: 'John' },
          afterSnapshot: { passwordHash: '[REDACTED]', displayName: 'John Doe' },
          changes: {
            passwordHash: { before: '[REDACTED]', after: '[REDACTED]' },
            displayName: { before: 'John', after: 'John Doe' },
          },
        }),
      );
    });
  });

  describe('CSV Export Formula Injection Defense', () => {
    it('should prefix formulas starting with =, +, -, or @ with a single quote', async () => {
      const csv = await service.exportAuditCsv({}, mockActor);

      expect(csv).toContain("'=2+5");
    });
  });
});
