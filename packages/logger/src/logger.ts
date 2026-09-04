import pino from 'pino';
import { PINO_REDACT_PATHS } from './redaction.js';

export interface LoggerOptions {
  name?: string;
  level?: string;
  pretty?: boolean;
}

export type Logger = pino.Logger;

export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    name = 'community-os',
    level = process.env.LOG_LEVEL || 'info',
    pretty = false,
  } = options;

  const isPretty =
    pretty || process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV === 'development';

  if (isPretty) {
    return pino({
      name,
      level,
      redact: {
        paths: PINO_REDACT_PATHS,
        censor: '[REDACTED]',
      },
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino({
    name,
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: PINO_REDACT_PATHS,
      censor: '[REDACTED]',
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  });
}

export const logger = createLogger();
