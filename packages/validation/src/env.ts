import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().default('CommunityOS'),
  APP_VERSION: z.string().default('0.1.0'),
  API_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),

  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres_dev_password'),
  DATABASE_NAME: z.string().default('community_os_dev'),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().min(1, { message: 'REDIS_URL is required' }),

  JWT_ACCESS_SECRET: z.string().min(16, { message: 'JWT_ACCESS_SECRET must be at least 16 chars' }),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, { message: 'JWT_REFRESH_SECRET must be at least 16 chars' }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  SWAGGER_ENABLED: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(config);
  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`\n[FATAL] Environment Configuration Validation Failed:\n${formattedErrors}\n`);
  }
  return result.data;
}
