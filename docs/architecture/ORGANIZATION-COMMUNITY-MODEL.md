# Organization & Community Aggregate Domain Model

## 1. Domain Aggregate Specifications

### Organization Aggregate

The `Organization` is the root customer account in the platform.

```
Organization Aggregate
├── id: UUID (PK)
├── name: string (2-255 chars)
├── slug: string (Canonical normalized, globally unique)
├── legalName: string | null
├── status: EntityStatus (ACTIVE | SUSPENDED | ARCHIVED)
├── defaultTimezone: string (IANA timezone, e.g. 'Asia/Kolkata', 'UTC')
├── defaultLocale: string (BCP 47, e.g. 'en-IN', 'en-US')
├── defaultCurrency: string (ISO 4217, e.g. 'INR', 'USD')
├── settings: JSONB (Dynamic enterprise configurations)
├── version: number (Optimistic concurrency counter)
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

---

### Community Aggregate

The `Community` represents an individual physical property, housing society, gated complex, or township.

```
Community Aggregate
├── id: UUID (PK)
├── organizationId: UUID (FK -> Organization.id)
├── name: string (2-255 chars)
├── code: string (Unique per organization, e.g. 'GVT-01')
├── slug: string (Unique per organization, e.g. 'green-valley-township')
├── status: EntityStatus (ACTIVE | SUSPENDED | ARCHIVED)
├── timezone: string (IANA timezone)
├── locale: string (BCP 47)
├── currency: string (ISO 4217)
├── address: Address (Value Object)
│     ├── addressLine1: string
│     ├── addressLine2: string | null
│     ├── locality: string | null
│     ├── city: string
│     ├── region: string | null
│     ├── postalCode: string
│     └── countryCode: string (ISO 3166-1 alpha-2 / alpha-3)
├── settings: JSONB
├── version: number (Optimistic concurrency counter)
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

---

## 2. Status Lifecycle State Machine

Both `Organization` and `Community` follow a formal lifecycle:

```
      ┌───────────┐
      │  ACTIVE   │ ◄───────┐
      └─────┬─────┘         │
            │               │
      ┌─────▼─────┐         │
      │ SUSPENDED │ ────────┘
      └─────┬─────┘
            │
      ┌─────▼─────┐
      │ ARCHIVED  │ (Terminal State)
      └───────────┘
```

### Transition Rules

1. `ACTIVE` ↔ `SUSPENDED`: Permitted for billing pauses or administrative audits.
2. `ACTIVE` → `ARCHIVED`, `SUSPENDED` → `ARCHIVED`: Permitted for decommissioned properties.
3. `ARCHIVED` is **terminal**: No direct mutation or activation is permitted.
4. If an `Organization` is `ARCHIVED`, child `Communities` cannot be created or mutated.

---

## 3. Optimistic Concurrency Control

All mutating operations (`update`, `changeStatus`) support optimistic locking:

- The client passes `expectedVersion`.
- If the current database version does not match `expectedVersion`, the API rejects the update with `HTTP 409 Conflict` (`CONCURRENCY_CONFLICT`).
- On successful update, the database version increments by 1.
