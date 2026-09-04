import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RequestContext } from '@community-os/observability';
import { createLogger } from '@community-os/logger';
import type { ApiErrorResponse } from '@community-os/types';
import { DomainException } from '../exceptions/domain.exceptions.js';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = createLogger({ name: 'GlobalExceptionFilter' });

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      RequestContext.getRequestId() || (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected internal error occurred';
    let errorDetails: Array<{ field?: string; message: string; code?: string }> | undefined;

    if ((exception as any)?.name === 'ZodError' || Array.isArray((exception as any)?.issues)) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      errorMessage = (exception as any).issues?.[0]?.message || 'Validation failed';
      errorDetails = (exception as any).issues?.map((i: any) => ({
        field: i.path?.join('.'),
        message: i.message,
      }));
    } else if (exception instanceof DomainException) {
      status = exception.getStatus();
      errorCode = exception.code;
      errorMessage = exception.message;
      errorDetails = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
        errorCode = this.statusToErrorCode(status);
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        errorMessage = (body['message'] as string) || exception.message;
        errorCode =
          (body['error'] as string) || (body['code'] as string) || this.statusToErrorCode(status);

        if (Array.isArray(body['message'])) {
          errorMessage = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
          errorDetails = (body['message'] as string[]).map((msg) => ({
            message: msg,
          }));
        }
      }
    } else if (exception instanceof Error) {
      // Prisma error code mapping
      if ('code' in exception) {
        const prismaCode = (exception as { code: string }).code;
        if (prismaCode === 'P2002') {
          status = HttpStatus.CONFLICT;
          errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
          errorMessage = 'A record with these unique constraints already exists.';
        } else if (prismaCode === 'P2025') {
          status = HttpStatus.NOT_FOUND;
          errorCode = 'RECORD_NOT_FOUND';
          errorMessage = 'The requested database record was not found.';
        }
      }

      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        errorMessage = exception.message;
      }
      this.logger.error(
        {
          err: exception,
          requestId,
          url: request.url,
          method: request.method,
        },
        `Unhandled Exception: ${exception.message}`,
      );
    }

    const payload: ApiErrorResponse = {
      error: {
        code: errorCode,
        message: errorMessage,
        ...(errorDetails ? { details: errorDetails } : {}),
      },
      requestId,
    };

    response.status(status).json(payload);
  }

  private statusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
