import { ConfigurationResolverService } from './configuration-resolver.service.js';
import { ConfigurationRepository } from './configuration.repository.js';
import { RedisService } from '../redis/redis.service.js';
import { LoggerService } from '../logger/logger.service.js';

describe('ConfigurationResolverService (Unit)', () => {
  let resolver: ConfigurationResolverService;
  let mockRepo: jest.Mocked<ConfigurationRepository>;
  let mockRedis: jest.Mocked<RedisService>;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    mockRepo = {
      findOverride: jest.fn(),
      findManyOverrides: jest.fn(),
      upsertOverride: jest.fn(),
      deleteOverride: jest.fn(),
    } as unknown as jest.Mocked<ConfigurationRepository>;

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<RedisService>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    resolver = new ConfigurationResolverService(mockRepo, mockRedis, mockLogger);
  });

  it('resolves registry default value when no overrides exist', async () => {
    mockRepo.findOverride.mockResolvedValue(null);

    const result = await resolver.resolve('community.display.buildingLabel', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.key).toBe('community.display.buildingLabel');
    expect(result.value).toBe('Building');
    expect(result.resolvedFrom).toBe('DEFAULT');
    expect(result.isInherited).toBe(true);
  });

  it('resolves community override with highest priority', async () => {
    mockRepo.findOverride.mockImplementation(async (key, scopeType) => {
      if (scopeType === 'COMMUNITY') {
        return {
          id: 'ov-1',
          key,
          scopeType: 'COMMUNITY',
          scopeId: 'comm-1',
          organizationId: 'org-1',
          communityId: 'comm-1',
          value: 'Tower',
          version: 1,
          status: 'ACTIVE',
          changeReason: 'Community override',
          createdById: null,
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });

    const result = await resolver.resolve('community.display.buildingLabel', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.value).toBe('Tower');
    expect(result.resolvedFrom).toBe('COMMUNITY');
    expect(result.isInherited).toBe(false);
  });

  it('falls back to organization override if no community override exists', async () => {
    mockRepo.findOverride.mockImplementation(async (key, scopeType) => {
      if (scopeType === 'COMMUNITY') return null;
      if (scopeType === 'ORGANIZATION') {
        return {
          id: 'ov-2',
          key,
          scopeType: 'ORGANIZATION',
          scopeId: 'org-1',
          organizationId: 'org-1',
          communityId: null,
          value: 'Block',
          version: 2,
          status: 'ACTIVE',
          changeReason: 'Org default',
          createdById: null,
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });

    const result = await resolver.resolve('community.display.buildingLabel', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.value).toBe('Block');
    expect(result.resolvedFrom).toBe('ORGANIZATION');
    expect(result.isInherited).toBe(true);
  });

  it('returns cached value when present in Redis', async () => {
    const cachedPayload = {
      key: 'community.display.unitLabel',
      value: 'Apartment',
      valueType: 'STRING',
      resolvedFrom: 'COMMUNITY',
      scopeId: 'comm-1',
      isInherited: false,
      version: 1,
      sensitivity: 'PUBLIC_CLIENT',
    };

    mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedPayload));

    const result = await resolver.resolve('community.display.unitLabel', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.value).toBe('Apartment');
    expect(mockRepo.findOverride).not.toHaveBeenCalled();
  });

  it('throws DomainException on unknown key', async () => {
    await expect(resolver.resolve('unknown.key.foo')).rejects.toThrow(
      'Unknown configuration key: "unknown.key.foo"',
    );
  });
});
