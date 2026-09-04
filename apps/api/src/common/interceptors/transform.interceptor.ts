import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContext } from '@community-os/observability';
import type { ApiResponse } from '@community-os/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const requestId = RequestContext.getRequestId() || 'system';

    return next.handle().pipe(
      map((data) => {
        // If data is already enclosed in a standard envelope or contains meta
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            data: data.data,
            meta: data.meta,
            requestId,
          };
        }

        return {
          data,
          requestId,
        };
      }),
    );
  }
}
