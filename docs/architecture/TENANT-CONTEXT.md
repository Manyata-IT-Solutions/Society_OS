# Tenant Context & Context Propagation

## 1. Overview

Every HTTP request, asynchronous background task, and event handler in Community OS carries an explicit execution context.

The Tenant Context defines:

1. **Who is acting?** (`userId`, `roles`, `permissions`, `isPlatformAdmin`)
2. **In what tenant scope?** (`organizationId`, `communityId`)
3. **With what trace identifiers?** (`requestId`, `correlationId`)

---

## 2. Context Structure

```typescript
export interface TenantContext {
  organizationId?: string;
  communityId?: string;
  userId?: string;
  roles?: string[];
  permissions?: string[];
  isPlatformAdmin?: boolean;
  correlationId: string;
  requestId: string;
}

export interface RequestContextStore extends TenantContext {
  startTime: number;
}
```

---

## 3. Propagation via AsyncLocalStorage

To prevent passing `ctx` manually through 15 layers of nested function calls while avoiding unsafe global mutable singletons, Community OS uses Node.js `AsyncLocalStorage`:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

const contextStorage = new AsyncLocalStorage<RequestContextStore>();

// Execution wraps request lifecycle
RequestContext.run(store, () => {
  next();
});
```

### Safety Guarantees

- **Asynchronous Isolation**: Promises, callbacks, and microtasks preserve their exact context without cross-request bleeding.
- **Trace Context Preservation**: Logs and events automatically enrich themselves with `requestId`, `correlationId`, `organizationId`, and `communityId`.

---

## 4. Background Job & Asynchronous Worker Rules

**CRITICAL RULE**: Background workers (e.g. BullMQ / Redis queues) do _not_ have an active HTTP request context.

When queuing or executing background jobs:

1. The message payload **must explicitly carry** `organizationId`, `communityId`, and `correlationId`.
2. The job worker must initialize a synthetic `TenantContext` using `RequestContext.run({ ... }, jobHandler)` before executing domain logic.
3. No background job may run with an undefined tenant scope unless explicitly performing global system maintenance.
