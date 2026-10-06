# Property Title & Ownership Model

## 1. Overview

`UnitOwnership` represents the legal and commercial title to a residential unit. Community OS rejects simplistic `unit.ownerId` foreign keys in favor of an effective-dated, multi-party ownership model.

---

## 2. Model Structure

```prisma
model UnitOwnership {
  id             String          @id @default(uuid()) @db.Uuid
  organizationId String          @map("organization_id") @db.Uuid
  communityId    String          @map("community_id") @db.Uuid
  unitId         String          @map("unit_id") @db.Uuid
  residentId     String          @map("resident_id") @db.Uuid
  ownershipShare Decimal?        @map("ownership_share") @db.Decimal(5, 2)
  ownershipType  OwnershipType   @default(SOLE) @map("ownership_type")
  isPrimaryOwner Boolean         @default(true) @map("is_primary_owner")
  startDate      DateTime        @map("start_date") @db.Date
  endDate        DateTime?       @map("end_date") @db.Date
  status         OwnershipStatus @default(ACTIVE)
  version        Int             @default(1)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
}
```

---

## 3. Key Capabilities

1. **Sole & Joint Ownership**: Supports single owners as well as multiple co-owners with exact percentage shares (`Decimal(5, 2)` e.g. 50.00% / 50.00%).
2. **Ownership Types**:
   - `SOLE`: Individual single ownership.
   - `JOINT`: Co-ownership between family members or partners.
   - `CORPORATE`: Company or institutional ownership.
   - `DEVELOPER`: Unsold developer inventory.
   - `TRUST`: Held in family or institutional trust.
3. **Transactional Ownership Transfer**: Transferring title transitions prior owners to `status = 'TRANSFERRED'` with `endDate = transferDate` and provisions incoming owners in an atomic database transaction.
