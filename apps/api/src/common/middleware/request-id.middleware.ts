import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  RequestContext,
  TRACE_HEADERS,
  generateTraceId,
  generateCorrelationId,
} from '@community-os/observability';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers[TRACE_HEADERS.REQUEST_ID] as string) || generateTraceId();
    const correlationId =
      (req.headers[TRACE_HEADERS.CORRELATION_ID] as string) || generateCorrelationId();

    // Attach to response headers
    res.setHeader(TRACE_HEADERS.REQUEST_ID, requestId);
    res.setHeader(TRACE_HEADERS.CORRELATION_ID, correlationId);

    // Extract tenant headers if provided
    const organizationId = req.headers[TRACE_HEADERS.ORGANIZATION_ID] as string | undefined;
    const communityId = req.headers[TRACE_HEADERS.COMMUNITY_ID] as string | undefined;

    RequestContext.run(
      {
        requestId,
        correlationId,
        organizationId,
        communityId,
        startTime: Date.now(),
      },
      () => {
        next();
      },
    );
  }
}
