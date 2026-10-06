import type { Result } from '@community-os/types';

export interface RepositoryFindOptions {
  limit?: number;
  offset?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface IRepository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  findMany(filter?: Partial<T>, options?: RepositoryFindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<Result<T, Error>>;
  update(id: TId, data: Partial<T>): Promise<Result<T, Error>>;
  delete(id: TId): Promise<Result<boolean, Error>>;
  count(filter?: Partial<T>): Promise<number>;
}

export interface ITenantScopedRepository<T, TId = string> {
  findById(tenantId: string, id: TId): Promise<T | null>;
  findMany(tenantId: string, filter?: Partial<T>, options?: RepositoryFindOptions): Promise<T[]>;
  create(tenantId: string, data: Partial<T>): Promise<Result<T, Error>>;
  update(tenantId: string, id: TId, data: Partial<T>): Promise<Result<T, Error>>;
  delete(tenantId: string, id: TId): Promise<Result<boolean, Error>>;
  count(tenantId: string, filter?: Partial<T>): Promise<number>;
}
