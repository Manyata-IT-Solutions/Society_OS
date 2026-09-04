import { Injectable } from '@nestjs/common';
import { loadConfig, type Environment } from '@community-os/config';

@Injectable()
export class ConfigService {
  private readonly config: Environment;

  constructor() {
    this.config = loadConfig();
  }

  get<K extends keyof Environment>(key: K): Environment[K] {
    return this.config[key];
  }

  get port(): number {
    return this.config.PORT;
  }

  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  get apiPrefix(): string {
    return this.config.API_PREFIX;
  }

  get appName(): string {
    return this.config.APP_NAME;
  }

  get appVersion(): string {
    return this.config.APP_VERSION;
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.config.REDIS_URL;
  }

  get corsOrigins(): string[] {
    return this.config.CORS_ORIGINS.split(',').map((o) => o.trim());
  }

  get isSwaggerEnabled(): boolean {
    return this.config.SWAGGER_ENABLED;
  }
}
