import { Injectable } from '@nestjs/common';
import { RoleAssignmentRepository } from '../iam/role-assignment.repository.js';
import { evaluateScopedPermission, type TargetScope } from '@community-os/auth';
import type { Actor, ScopedPermission, ScopeType } from '@community-os/types';
import { TenantAccessDeniedException } from '../../common/exceptions/domain.exceptions.js';
import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
    private readonly logger: LoggerService,
  ) {}

  async getActorScopedPermissions(userId: string): Promise<ScopedPermission[]> {
    const assignments = await this.roleAssignmentRepo.findActiveByUserId(userId);
    const scopedPermissions: ScopedPermission[] = [];

    for (const assignment of assignments) {
      if (!assignment.role || !assignment.role.permissions) continue;

      for (const rolePerm of assignment.role.permissions) {
        if (!rolePerm.permission) continue;
        scopedPermissions.push({
          permission: rolePerm.permission.code,
          scopeType: assignment.scopeType as ScopeType,
          scopeId: assignment.scopeId,
        });
      }
    }

    return scopedPermissions;
  }

  async can(actor: Actor, requiredPermission: string, targetScope: TargetScope): Promise<boolean> {
    if (!actor || !actor.id) {
      return false;
    }

    if (actor.isPlatformAdmin) {
      return true;
    }

    const permissions = await this.getActorScopedPermissions(actor.id);
    const granted = evaluateScopedPermission(permissions, requiredPermission, targetScope);

    if (!granted) {
      this.logger.debug(
        `Authorization DENIED for user ${actor.id} (${actor.email}) on permission '${requiredPermission}' with scope ${targetScope.scopeType}:${targetScope.scopeId}`,
        'AuthorizationService',
      );
    }

    return granted;
  }

  async enforce(actor: Actor, requiredPermission: string, targetScope: TargetScope): Promise<void> {
    const granted = await this.can(actor, requiredPermission, targetScope);
    if (!granted) {
      throw new TenantAccessDeniedException(
        `Access denied: Missing required permission '${requiredPermission}' for target scope ${targetScope.scopeType}${targetScope.scopeId ? ':' + targetScope.scopeId : ''}.`,
      );
    }
  }
}
