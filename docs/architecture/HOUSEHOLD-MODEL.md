# Household & Membership Model

## 1. Overview

A `Household` in Community OS represents a living unit group associated with a specific residential `Unit` over an effective time period (`startDate` to `endDate`).

---

## 2. Model Structure

```prisma
model Household {
  id                       String          @id @default(uuid()) @db.Uuid
  organizationId           String          @map("organization_id") @db.Uuid
  communityId              String          @map("community_id") @db.Uuid
  unitId                   String          @map("unit_id") @db.Uuid
  name                     String?         @db.VarChar(150)
  status                   HouseholdStatus @default(ACTIVE)
  primaryContactResidentId String?         @map("primary_contact_resident_id") @db.Uuid
  startDate                DateTime        @map("start_date") @db.Date
  endDate                  DateTime?       @map("end_date") @db.Date
  version                  Int             @default(1)
  createdAt                DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  members                  HouseholdMember[]
  tenancies                UnitTenancy[]
  occupancies              UnitOccupancy[]
}
```

---

## 3. Household Member Relationships

Each member of a household is linked via `HouseholdMember`:

```prisma
enum HouseholdRelationshipType {
  SELF
  SPOUSE
  CHILD
  PARENT
  SIBLING
  RELATIVE
  DOMESTIC_STAFF
  OTHER
}
```

- **Primary Contact**: Every household has exactly one active primary contact resident who receives official community notices and billing communications.
- **Member Lifecycles**: Members can join and leave households independently (`status: ACTIVE | INACTIVE | LEFT`) without altering the household group itself.
