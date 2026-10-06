import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '@community-os/observability';
import type { TenantContext } from '@community-os/types';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): TenantContext => {
    const store = RequestContext.getStore();
    return {
      organizationId: store?.organizationId,
      communityId: store?.communityId,
      correlationId: store?.correlationId || 'unknown',
      requestId: store?.requestId || 'unknown',
    };
  },
);
