# Tenant Isolation & Security Specifications

## 1. Threat Model & Attack Vectors

| Attack Vector                  | Threat Scenario                                               | Mitigation in Community OS                                                                                         |
| :----------------------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| **Tenant ID Spoofing**         | Attacker sends `x-organization-id: <Victim-Org>` header.      | Tenant context is verified against authenticated session claims; headers without valid authorization are rejected. |
| **Cross-Tenant ID Probing**    | Attacker queries `/api/v1/communities/<Victim-Community-ID>`. | `CommunityRepository` mandates `WHERE id = $1 AND organization_id = $2`, returning `404 Not Found`.                |
| **Duplicate Collision Hijack** | Attacker attempts to register a conflicting code or slug.     | Database compound unique constraints enforce uniqueness per organization.                                          |
| **Concurrent Overwrite**       | Two admins modify the same record concurrently.               | Version-checked optimistic locking (`expectedVersion`) prevents silent overwrites.                                 |

---

## 2. Least Privilege Database Access

The application runs using dedicated non-superuser credentials:

- No database superuser connections from the API.
- DDL migrations run through a privileged migration pipeline during deployments.
- Operational queries are scoped to the `public` schema with explicit table grants.

---

## 3. Audit Logging Protocol

Every tenant-scoped mutation produces an audit event recording:

- `actorId`: The user performing the action
- `organizationId`: Target tenant organization
- `communityId`: Target community (if applicable)
- `operation`: e.g. `ORGANIZATION_STATUS_CHANGED`
- `entityId`: Target resource UUID
- `requestId` & `correlationId`: Distributed trace markers
