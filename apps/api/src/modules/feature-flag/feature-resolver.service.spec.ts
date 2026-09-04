import { FeatureResolverService } from './feature-resolver.service.js';
import { FeatureOverrideRepository } from './feature-override.repository.js';

describe('FeatureResolverService (Unit)', () => {
  let resolver: FeatureResolverService;
  let mockRepo: jest.Mocked<FeatureOverrideRepository>;

  beforeEach(() => {
    mockRepo = {
      findOverride: jest.fn(),
      findManyOverrides: jest.fn(),
      upsertOverride: jest.fn(),
      deleteOverride: jest.fn(),
    } as unknown as jest.Mocked<FeatureOverrideRepository>;

    resolver = new FeatureResolverService(mockRepo);
  });

  it('resolves default enabled state when no override exists', async () => {
    mockRepo.findOverride.mockResolvedValue(null);

    const result = await resolver.resolve('feature.documentLibrary', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.key).toBe('feature.documentLibrary');
    expect(result.enabled).toBe(true);
    expect(result.resolvedFrom).toBe('DEFAULT');
    expect(result.dependenciesMet).toBe(true);
  });

  it('resolves explicit community override when present', async () => {
    mockRepo.findOverride.mockImplementation(async (featureKey, scopeType) => {
      if (scopeType === 'COMMUNITY') {
        return {
          id: 'ov-1',
          featureKey,
          scopeType: 'COMMUNITY',
          scopeId: 'comm-1',
          organizationId: 'org-1',
          communityId: 'comm-1',
          enabled: false,
          reason: 'Feature disabled for trial community',
          version: 1,
          createdById: null,
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });

    const result = await resolver.resolve('feature.documentLibrary', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.enabled).toBe(false);
    expect(result.resolvedFrom).toBe('COMMUNITY');
    expect(result.reason).toBe('Feature disabled for trial community');
  });

  it('disables feature if its dependency is disabled', async () => {
    // feature.residentAccountInvites depends on feature.inAppNotifications
    mockRepo.findOverride.mockImplementation(async (featureKey) => {
      if (featureKey === 'feature.inAppNotifications') {
        return {
          id: 'ov-2',
          featureKey: 'feature.inAppNotifications',
          scopeType: 'COMMUNITY',
          scopeId: 'comm-1',
          organizationId: 'org-1',
          communityId: 'comm-1',
          enabled: false,
          reason: 'Notifications turned off',
          version: 1,
          createdById: null,
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });

    const result = await resolver.resolve('feature.residentAccountInvites', {
      organizationId: 'org-1',
      communityId: 'comm-1',
    });

    expect(result.enabled).toBe(false);
    expect(result.dependenciesMet).toBe(false);
    expect(result.reason).toContain('Disabled due to unmet dependency');
  });

  it('returns client-safe features map', async () => {
    mockRepo.findOverride.mockResolvedValue(null);

    const allFeatures = await resolver.resolveAll({}, true);
    expect(allFeatures.length).toBeGreaterThan(0);
    expect(allFeatures.every((f) => f.isClientSafe)).toBe(true);
  });
});
