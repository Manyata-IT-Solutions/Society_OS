# Authorization Architecture & Scoped RBAC Engine

## 1. Core Principle: Scoped RBAC

Access in Community OS is modeled strictly as:
$$\text{Decision} = f(\text{SUBJECT}, \text{RESOURCE}, \text{ACTION}, \text{SCOPE})$$

Authorization does **NOT** rely on primitive boolean flags (`isSuperAdmin`, `isAdmin`) on user records. Every capability requires an explicit, active role assignment bound to a defined scope boundary.

---

## 2. Scope Hierarchy & Evaluation Rules

The platform supports four canonical scope levels:

| Scope Level    | Meaning                                | Downward Inheritance                                       |
| :------------- | :------------------------------------- | :--------------------------------------------------------- |
| `PLATFORM`     | Global platform root authority         | Inherits to ALL Organizations & Communities                |
| `ORGANIZATION` | Enterprise organization customer scope | Inherits to ALL Communities belonging to this Organization |
| `COMMUNITY`    | Individual property or society scope   | Strictly isolated to this Community only                   |
| `OWN`          | Principal-owned resource scope         | Self-service profile/session updates only                  |

### Evaluation Algorithm

When evaluating if an actor can perform `requiredPermission` on a `targetScope`:

1. **Platform Rule**: If actor possesses an active role granting `requiredPermission` with scope `PLATFORM`, grant access.
2. **Organization Rule**: If `targetScope` is `ORGANIZATION`, grant access if actor has `requiredPermission` with scope `ORGANIZATION` where `assignment.scopeId == targetScope.scopeId`.
3. **Community Rule**: If `targetScope` is `COMMUNITY`:
   - Grant access if actor has `requiredPermission` with scope `COMMUNITY` where `assignment.scopeId == targetScope.scopeId`.
   - Grant access if actor has `requiredPermission` with scope `ORGANIZATION` where `assignment.scopeId == targetScope.parentOrganizationId` (downward inheritance).
4. **Self / Own Rule**: If `targetScope` is `OWN`, grant access if actor has `requiredPermission` with scope `OWN`.
5. **Deny by Default**: If none of the above matches, immediately deny access (`HTTP 403 / TenantAccessDeniedException`).

---

## 3. Declarative Route Guards

Controllers use NestJS declarative metadata decorators:

```ts
@RequirePermission(PERMISSIONS.COMMUNITY_UPDATE, { scopeType: 'COMMUNITY', scopeParam: 'communityId' })
@Patch(':communityId')
async updateCommunity(...) { ... }
```

The `PermissionGuard` intercepts the execution context, extracts the target scope parameters from HTTP route params or headers, and invokes `AuthorizationService.enforce()`.
