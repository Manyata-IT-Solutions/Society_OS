import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service.js';
import { RoleAssignmentRepository } from '../iam/role-assignment.repository.js';
import { LoggerService } from '../logger/logger.service.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';

describe('AuthorizationService (Scoped RBAC Engine)', () => {
  let service: AuthorizationService;
  let roleAssignmentRepo: { [K in keyof RoleAssignmentRepository]?: jest.Mock };

  beforeEach(async () => {
    roleAssignmentRepo = {
      findActiveByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: RoleAssignmentRepository, useValue: roleAssignmentRepo },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe('Scoped Authorization Evaluation', () => {
    it('should grant access to platform admins unconditionally', async () => {
      const platformActor: Actor = {
        id: 'admin-1',
        email: 'admin@platform.io',
        displayName: 'Root Admin',
        isPlatformAdmin: true,
        sessionId: 'sess-1',
      };

      const canAccess = await service.can(platformActor, PERMISSIONS.ORGANIZATION_CREATE, {
        scopeType: 'PLATFORM',
      });

      expect(canAccess).toBe(true);
    });

    it('should grant organization admin access to their own organization', async () => {
      const orgActor: Actor = {
        id: 'org-admin-1',
        email: 'orgadmin@org1.com',
        displayName: 'Org Admin',
        isPlatformAdmin: false,
        sessionId: 'sess-2',
      };

      roleAssignmentRepo.findActiveByUserId!.mockResolvedValue([
        {
          id: 'assign-1',
          scopeType: 'ORGANIZATION',
          scopeId: 'org-123',
          role: {
            code: 'ORG_ADMIN',
            permissions: [
              { permission: { code: PERMISSIONS.COMMUNITY_CREATE } },
              { permission: { code: PERMISSIONS.ORGANIZATION_UPDATE } },
            ],
          },
        },
      ]);

      // Target matching organization scope -> GRANTED
      const canUpdateOwnOrg = await service.can(orgActor, PERMISSIONS.ORGANIZATION_UPDATE, {
        scopeType: 'ORGANIZATION',
        scopeId: 'org-123',
      });
      expect(canUpdateOwnOrg).toBe(true);

      // Target nested community in own organization -> GRANTED via hierarchical inheritance
      const canCreateCommunityInOwnOrg = await service.can(orgActor, PERMISSIONS.COMMUNITY_CREATE, {
        scopeType: 'COMMUNITY',
        scopeId: 'comm-1',
        parentOrganizationId: 'org-123',
      });
      expect(canCreateCommunityInOwnOrg).toBe(true);

      // Target different organization -> DENIED
      const canUpdateOtherOrg = await service.can(orgActor, PERMISSIONS.ORGANIZATION_UPDATE, {
        scopeType: 'ORGANIZATION',
        scopeId: 'org-OTHER-999',
      });
      expect(canUpdateOtherOrg).toBe(false);
    });

    it('should grant community admin access only to assigned community', async () => {
      const commActor: Actor = {
        id: 'comm-admin-1',
        email: 'commadmin@property.com',
        displayName: 'Community Admin',
        isPlatformAdmin: false,
        sessionId: 'sess-3',
      };

      roleAssignmentRepo.findActiveByUserId!.mockResolvedValue([
        {
          id: 'assign-2',
          scopeType: 'COMMUNITY',
          scopeId: 'comm-777',
          role: {
            code: 'COMMUNITY_ADMIN',
            permissions: [{ permission: { code: PERMISSIONS.COMMUNITY_UPDATE } }],
          },
        },
      ]);

      // Target assigned community -> GRANTED
      const canUpdateAssignedComm = await service.can(commActor, PERMISSIONS.COMMUNITY_UPDATE, {
        scopeType: 'COMMUNITY',
        scopeId: 'comm-777',
      });
      expect(canUpdateAssignedComm).toBe(true);

      // Target other community -> DENIED
      const canUpdateOtherComm = await service.can(commActor, PERMISSIONS.COMMUNITY_UPDATE, {
        scopeType: 'COMMUNITY',
        scopeId: 'comm-888',
      });
      expect(canUpdateOtherComm).toBe(false);

      // Target parent organization -> DENIED (upward escalation blocked)
      const canUpdateOrg = await service.can(commActor, PERMISSIONS.ORGANIZATION_UPDATE, {
        scopeType: 'ORGANIZATION',
        scopeId: 'org-123',
      });
      expect(canUpdateOrg).toBe(false);
    });

    it('should deny by default when user has no matching permissions', async () => {
      const guestActor: Actor = {
        id: 'guest-1',
        email: 'guest@test.com',
        displayName: 'Guest',
        isPlatformAdmin: false,
        sessionId: 'sess-4',
      };

      roleAssignmentRepo.findActiveByUserId!.mockResolvedValue([]);

      const canDo = await service.can(guestActor, PERMISSIONS.ORGANIZATION_CREATE, {
        scopeType: 'PLATFORM',
      });
      expect(canDo).toBe(false);
    });
  });
});
