import { AsyncLocalStorage } from 'node:async_hooks';
import type { TenantContext } from '@community-os/types';

export interface RequestContextStore extends TenantContext {
  startTime: number;
}

const contextStorage = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  getStore(): RequestContextStore | undefined {
    return contextStorage.getStore();
  },

  run<R>(store: RequestContextStore, callback: () => R): R {
    return contextStorage.run(store, callback);
  },

  getRequestId(): string | undefined {
    return contextStorage.getStore()?.requestId;
  },

  getCorrelationId(): string | undefined {
    return contextStorage.getStore()?.correlationId;
  },

  getTenant(): { organizationId?: string; communityId?: string } | undefined {
    const store = contextStorage.getStore();
    if (!store) return undefined;
    return {
      organizationId: store.organizationId,
      communityId: store.communityId,
    };
  },

  getUser(): { userId?: string; roles?: string[]; permissions?: string[] } | undefined {
    const store = contextStorage.getStore();
    if (!store) return undefined;
    return {
      userId: store.userId,
      roles: store.roles,
      permissions: store.permissions,
    };
  },
};
