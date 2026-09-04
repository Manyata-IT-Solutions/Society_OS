# Privilege Model & Escalation Prevention

## 1. Hierarchy of Administrative Principals

Community OS enforces strict boundaries between:

1. **Platform Administrators**: Superusers managing infrastructure, creating initial enterprise organizations, and configuring global policies.
2. **Organization Administrators**: Enterprise tenant admins managing their enterprise portfolio, assigning roles, and creating communities within their organization boundary.
3. **Community Administrators**: Site-level managers operating within a single physical gated community or township.

---

## 2. Privilege Escalation Defenses

### Rule 1: No Self-Escalation

An administrator cannot grant privileges higher than their own assigned scope.

- Non-Platform Admins are blocked from assigning roles with `PLATFORM` scope type.
- Non-Platform Admins are blocked from assigning the `PLATFORM_ADMIN` role code.
- Violation attempts trigger `HTTP 403 PRIVILEGE_ESCALATION_DENIED`.

### Rule 2: Immutable System Roles

Predefined system roles (`PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `ORG_ADMIN`, `COMMUNITY_ADMIN`, `AUDITOR_READ_ONLY`) have `isSystem: true` and cannot be modified or deleted by tenant administrators.

### Rule 3: Cross-Tenant Assignment Isolation

A tenant administrator in Organization A cannot assign any roles or memberships to Organization B or Community B. Scope validation checks enforce `scopeId == tenantContext.organizationId`.
