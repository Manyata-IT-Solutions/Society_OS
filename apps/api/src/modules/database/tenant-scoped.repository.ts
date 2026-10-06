import { PrismaService } from './prisma.service.js';
import type { TenantContext } from '@community-os/types';
import {
  TenantAccessDeniedException,
  InvalidTenantContextException,
} from '../../common/exceptions/domain.exceptions.js';

export abstract class TenantScopedRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Enforces that the request tenant context contains a valid organizationId
   */
  protected requireOrganizationScope(ctx: TenantContext): string {
    if (ctx.isPlatformAdmin) {
      // Platform admin can explicitly operate across scopes if organizationId is present
      if (ctx.organizationId) return ctx.organizationId;
    }

    if (!ctx.organizationId || ctx.organizationId.trim() === '') {
      throw new InvalidTenantContextException(
        'Operation requires an active organization scope in context.',
      );
    }

    return ctx.organizationId;
  }

  /**
   * Enforces that the request tenant context matches the expected organizationId
   */
  protected verifyOrganizationAccess(ctx: TenantContext, expectedOrgId: string): void {
    if (ctx.isPlatformAdmin) {
      return;
    }

    const currentOrgId = this.requireOrganizationScope(ctx);
    if (currentOrgId !== expectedOrgId) {
      throw new TenantAccessDeniedException(
        `Access denied: Current tenant (${currentOrgId}) does not have access to resource in organization (${expectedOrgId}).`,
      );
    }
  }
}
