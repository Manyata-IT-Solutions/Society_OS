import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSION_KEY,
  type RequirePermissionOptions,
} from '../decorators/require-permission.decorator.js';
import { AuthorizationService } from '../../modules/authorization/authorization.service.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import type { TargetScope } from '@community-os/auth';
import type { ScopeType } from '@community-os/types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<RequirePermissionOptions | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true; // No explicit permission required on this handler
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.actor;

    if (!actor) {
      return false;
    }

    // Resolve target scope from request parameters or headers
    const scopeType: ScopeType = requirement.scopeType || 'PLATFORM';
    let scopeId: string | null = null;

    if (requirement.scopeParam && request.params[requirement.scopeParam]) {
      scopeId = request.params[requirement.scopeParam] || null;
    } else if (request.params['organizationId']) {
      scopeId = request.params['organizationId'] || null;
    } else if (request.params['communityId']) {
      scopeId = request.params['communityId'] || null;
    } else if (request.headers['x-organization-id']) {
      scopeId = request.headers['x-organization-id'] as string;
    }

    const targetScope: TargetScope = {
      scopeType,
      scopeId,
    };

    await this.authorizationService.enforce(actor, requirement.permission, targetScope);
    return true;
  }
}
