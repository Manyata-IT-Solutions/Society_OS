# Role-Based Access Control (RBAC) Specification

## 1. Design Fundamentals

- **Separation of Roles and Permissions**: Roles do not contain business logic; they are collections of permissions.
- **Granular Permissions**: Permissions follow the `resource.action` notation (e.g. `organization.view`, `community.create`, `user.status_change`, `role.assign`).
- **System vs Custom Roles**:
  - `isSystem: true` roles are immutable and seeded by the platform.
  - Custom roles can be created dynamically by Organization Administrators to support customized enterprise workflows (e.g., Facility Managers, Finance Auditors, Gate Supervisors).

---

## 2. Seeded System Roles

| Role Code           | Name                       | Scope Level    | Description                                                             |
| :------------------ | :------------------------- | :------------- | :---------------------------------------------------------------------- |
| `PLATFORM_ADMIN`    | Platform Administrator     | `PLATFORM`     | Global root authority across infrastructure and all organizations.      |
| `PLATFORM_SUPPORT`  | Platform Support Operator  | `PLATFORM`     | Read-only diagnostics and support access across all resources.          |
| `ORG_ADMIN`         | Organization Administrator | `ORGANIZATION` | Full administrative authority over an organization and its communities. |
| `COMMUNITY_ADMIN`   | Community Administrator    | `COMMUNITY`    | Administrative authority within a single designated community.          |
| `AUDITOR_READ_ONLY` | Auditor (Read-Only)        | `ORGANIZATION` | Read-only audit access across assigned organizational scope.            |
