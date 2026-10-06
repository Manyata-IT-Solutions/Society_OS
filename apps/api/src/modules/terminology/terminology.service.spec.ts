import { TerminologyService } from './terminology.service.js';
import { ConfigurationResolverService } from '../configuration/configuration-resolver.service.js';

describe('TerminologyService (Unit)', () => {
  let service: TerminologyService;
  let mockResolver: jest.Mocked<ConfigurationResolverService>;

  beforeEach(() => {
    mockResolver = {
      resolve: jest.fn(),
      resolveMany: jest.fn(),
      resolveNamespace: jest.fn(),
      invalidateCache: jest.fn(),
    } as unknown as jest.Mocked<ConfigurationResolverService>;

    service = new TerminologyService(mockResolver);
  });

  it('resolves custom terminology from configuration resolver', async () => {
    mockResolver.resolve.mockImplementation(async (key) => {
      if (key === 'community.display.sectionLabel') {
        return {
          key,
          value: 'Phase',
          valueType: 'STRING',
          resolvedFrom: 'COMMUNITY',
          scopeId: 'comm-1',
          isInherited: false,
          version: 1,
          sensitivity: 'PUBLIC_CLIENT',
        };
      }
      if (key === 'community.display.buildingLabel') {
        return {
          key,
          value: 'Tower',
          valueType: 'STRING',
          resolvedFrom: 'COMMUNITY',
          scopeId: 'comm-1',
          isInherited: false,
          version: 1,
          sensitivity: 'PUBLIC_CLIENT',
        };
      }
      if (key === 'community.display.unitLabel') {
        return {
          key,
          value: 'Flat',
          valueType: 'STRING',
          resolvedFrom: 'COMMUNITY',
          scopeId: 'comm-1',
          isInherited: false,
          version: 1,
          sensitivity: 'PUBLIC_CLIENT',
        };
      }
      throw new Error('Unexpected key');
    });

    const result = await service.getTerminology({ organizationId: 'org-1', communityId: 'comm-1' });

    expect(result.sectionLabel).toBe('Phase');
    expect(result.buildingLabel).toBe('Tower');
    expect(result.unitLabel).toBe('Flat');
  });

  it('falls back to default labels if config resolver returns null', async () => {
    mockResolver.resolve.mockResolvedValue({
      key: 'key',
      value: null,
      valueType: 'STRING',
      resolvedFrom: 'DEFAULT',
      scopeId: null,
      isInherited: true,
      version: 1,
      sensitivity: 'PUBLIC_CLIENT',
    });

    const result = await service.getTerminology({});

    expect(result.sectionLabel).toBe('Section');
    expect(result.buildingLabel).toBe('Building');
    expect(result.unitLabel).toBe('Unit');
  });
});
