import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, type Logger } from '@community-os/logger';
import { RequestContext } from '@community-os/observability';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      name: 'api',
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  private enrichContext(context?: string): Record<string, unknown> {
    const store = RequestContext.getStore();
    return {
      context: context || 'Application',
      requestId: store?.requestId,
      correlationId: store?.correlationId,
      organizationId: store?.organizationId,
      communityId: store?.communityId,
    };
  }

  log(message: string, context?: string): void {
    this.logger.info(this.enrichContext(context), message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(
      {
        ...this.enrichContext(context),
        trace,
      },
      message,
    );
  }

  warn(message: string, context?: string): void {
    this.logger.warn(this.enrichContext(context), message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(this.enrichContext(context), message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace(this.enrichContext(context), message);
  }
}
