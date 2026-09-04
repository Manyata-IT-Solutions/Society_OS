import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@community-os/observability';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const store = RequestContext.getStore();
    if (store) {
      const orgHeader = req.headers['x-organization-id'];
      const communityHeader = req.headers['x-community-id'];

      if (typeof orgHeader === 'string' && orgHeader.trim().length > 0) {
        store.organizationId = orgHeader.trim();
      }
      if (typeof communityHeader === 'string' && communityHeader.trim().length > 0) {
        store.communityId = communityHeader.trim();
      }
    }
    next();
  }
}
