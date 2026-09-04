# Property Scopes & Multi-Level Authorization

## 1. Property Authorization Inheritance

Community OS IAM applies a hierarchical permission inheritance model down the property tree:

```
PLATFORM (Global Root)
  └── ORGANIZATION (Org Admin / Facility Operator)
        └── PORTFOLIO (Regional Manager / Cluster Lead)
              └── COMMUNITY (Estate Manager / Society Admin)
                    └── SECTION / BUILDING / FLOOR / UNIT
```

### Authorization Rules:

1. **Platform Scope**: Full administrative capabilities across all organizations, portfolios, communities, and units.
2. **Organization Scope**: Grants authorized operations across all portfolios and communities owned by that organization.
3. **Community Scope**: Grants management over sections, buildings, floors, and units belonging exclusively to that community.
4. **Denormalized Foreign Keys**: Every `Building`, `Floor`, and `Unit` explicitly maintains `organizationId` and `communityId` columns. This prevents deep JOIN lookups and enables database-level tenant isolation indexing.

---

## 2. Phase 3 Permission Matrix

| Permission Code           | Resource           | Action    | Role Assignments                                                       |
| :------------------------ | :----------------- | :-------- | :--------------------------------------------------------------------- |
| `portfolio.create`        | `portfolio`        | `create`  | `PLATFORM_ADMIN`, `ORG_ADMIN`                                          |
| `portfolio.view`          | `portfolio`        | `view`    | `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `ORG_ADMIN`, `AUDITOR_READ_ONLY` |
| `portfolio.update`        | `portfolio`        | `update`  | `PLATFORM_ADMIN`, `ORG_ADMIN`                                          |
| `portfolio.archive`       | `portfolio`        | `archive` | `PLATFORM_ADMIN`, `ORG_ADMIN`                                          |
| `property.section.create` | `property_section` | `create`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `property.section.view`   | `property_section` | `view`    | All roles                                                              |
| `property.section.update` | `property_section` | `update`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `building.create`         | `building`         | `create`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `building.view`           | `building`         | `view`    | All roles                                                              |
| `building.update`         | `building`         | `update`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `floor.create`            | `floor`            | `create`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `floor.view`              | `floor`            | `view`    | All roles                                                              |
| `floor.update`            | `floor`            | `update`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `unit.create`             | `unit`             | `create`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `unit.view`               | `unit`             | `view`    | All roles                                                              |
| `unit.update`             | `unit`             | `update`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `unit.import`             | `unit`             | `import`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
| `unit.export`             | `unit`             | `export`  | `PLATFORM_ADMIN`, `ORG_ADMIN`, `COMMUNITY_ADMIN`                       |
