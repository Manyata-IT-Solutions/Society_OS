export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface HealthCheckResponse {
  status: HealthStatus;
  appName: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface DependencyHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  message?: string;
}

export interface ReadinessResponse {
  status: HealthStatus;
  timestamp: string;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
  };
}

export interface LivenessResponse {
  status: 'alive';
  timestamp: string;
}
