# ADR 041: Dynamic Custom Fields Model & Entity Scoping

## Status

Accepted

## Context

Different residential communities require capturing unique domain metadata (e.g., parking bay numbers, pet registration details, electric vehicle charger IDs, move-in checklist items) without altering the relational database core schema.

## Decision

We designed a two-tier EAV (Entity-Attribute-Value) custom field architecture:

1. `CustomFieldDefinition`: Scoped strictly by tenant (`organizationId`, optional `communityId`) and entity type (`COMMUNITY`, `BUILDING`, `UNIT`, `RESIDENT`, `HOUSEHOLD`, `DOCUMENT`).
2. Supported field types: `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `SELECT`, `MULTI_SELECT`, `JSON`.
3. `CustomFieldValue`: Relates field definitions to concrete entity instances with server-side validation against `validationRules` (regex, range, options).
4. Definitions support lifecycle states (`ACTIVE`, `ARCHIVED`) and visibility tiers (`PUBLIC_CLIENT`, `TENANT_INTERNAL`, `ADMIN_ONLY`, `RESTRICTED`).

## Consequences

### Positive

- Zero schema migration overhead when communities introduce custom operational metadata.
- Strict tenant boundary enforcement prevents custom field leakage between organizations.
- Immutability of `fieldType` prevents data corruption on existing values.

### Negative

- Querying and filtering custom fields requires join queries or JSON operations rather than native relational table columns.
