import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined;
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  const url = databaseUrl || process.env.DATABASE_URL;

  const clientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  };

  if (url) {
    clientOptions.datasources = {
      db: {
        url,
      },
    };
  }

  return new PrismaClient(clientOptions);
}

let _db: PrismaClient | null = null;

export function getDb(): PrismaClient {
  if (!_db) {
    _db = global.__db || createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      global.__db = _db;
    }
  }
  return _db;
}

/**
 * Lazy singleton database client instance
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
