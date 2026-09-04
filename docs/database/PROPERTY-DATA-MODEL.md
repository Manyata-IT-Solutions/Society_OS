# Property Data Model & Relational Schema

## 1. Schema Definition & Indexing Architecture

The Property Hierarchy schema is defined in PostgreSQL 16 using Prisma ORM.

```prisma
model Portfolio {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @map("organization_id") @db.Uuid
  name           String        @db.VarChar(255)
  code           String        @db.VarChar(50)
  slug           String        @db.VarChar(100)
  description    String?       @db.Text
  status         EntityStatus  @default(ACTIVE)
  version        Int           @default(1)
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  communities  Community[]

  @@unique([organizationId, code])
  @@unique([organizationId, slug])
  @@index([organizationId])
  @@map("portfolios")
}

model CommunitySection {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @map("organization_id") @db.Uuid
  communityId    String        @map("community_id") @db.Uuid
  name           String        @db.VarChar(100)
  code           String        @db.VarChar(50)
  slug           String        @db.VarChar(100)
  description    String?       @db.Text
  status         EntityStatus  @default(ACTIVE)
  sortOrder      Int           @default(0) @map("sort_order")
  version        Int           @default(1)
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  community Community  @relation(fields: [communityId], references: [id], onDelete: Cascade)
  buildings Building[]
  units     Unit[]

  @@unique([communityId, code])
  @@unique([communityId, slug])
  @@index([communityId])
  @@map("community_sections")
}

model Building {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  communityId    String         @map("community_id") @db.Uuid
  sectionId      String?        @map("section_id") @db.Uuid
  name           String         @db.VarChar(100)
  code           String         @db.VarChar(50)
  buildingType   BuildingType   @default(TOWER) @map("building_type")
  status         BuildingStatus @default(ACTIVE)
  numberOfFloors Int?           @map("number_of_floors")
  sortOrder      Int            @default(0) @map("sort_order")
  version        Int            @default(1)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  community Community         @relation(fields: [communityId], references: [id], onDelete: Cascade)
  section   CommunitySection? @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  floors    Floor[]
  units     Unit[]

  @@unique([communityId, code])
  @@index([communityId])
  @@index([sectionId])
  @@map("buildings")
}

model Floor {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  communityId    String       @map("community_id") @db.Uuid
  buildingId     String       @map("building_id") @db.Uuid
  label          String       @db.VarChar(50)
  levelNumber    Int?         @map("level_number")
  sortOrder      Int          @default(0) @map("sort_order")
  status         EntityStatus @default(ACTIVE)
  version        Int          @default(1)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  building Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  units    Unit[]

  @@unique([buildingId, label])
  @@index([buildingId])
  @@index([communityId])
  @@map("floors")
}

model Unit {
  id               String       @id @default(uuid()) @db.Uuid
  organizationId   String       @map("organization_id") @db.Uuid
  communityId      String       @map("community_id") @db.Uuid
  sectionId        String?      @map("section_id") @db.Uuid
  buildingId       String?      @map("building_id") @db.Uuid
  floorId          String?      @map("floor_id") @db.Uuid
  unitNumber       String       @map("unit_number") @db.VarChar(50)
  displayName      String       @map("display_name") @db.VarChar(100)
  unitType         UnitType     @default(APARTMENT) @map("unit_type")
  status           UnitStatus   @default(ACTIVE)
  carpetArea       Decimal?     @map("carpet_area") @db.Decimal(10, 2)
  builtUpArea      Decimal?     @map("built_up_area") @db.Decimal(10, 2)
  superBuiltUpArea Decimal?     @map("super_built_up_area") @db.Decimal(10, 2)
  areaUnit         AreaUnit     @default(SQFT) @map("area_unit")
  bedroomCount     Int?         @map("bedroom_count")
  bathroomCount    Int?         @map("bathroom_count")
  version          Int          @default(1)
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  community Community         @relation(fields: [communityId], references: [id], onDelete: Cascade)
  section   CommunitySection? @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  building  Building?         @relation(fields: [buildingId], references: [id], onDelete: SetNull)
  floor     Floor?            @relation(fields: [floorId], references: [id], onDelete: SetNull)

  @@unique([communityId, buildingId, unitNumber])
  @@index([communityId])
  @@index([buildingId])
  @@index([floorId])
  @@index([sectionId])
  @@index([unitNumber])
  @@map("units")
}
```

---

## 2. Denormalized Tenant Keys Rationale

1. **Query Performance**: By storing `organizationId` and `communityId` on every child record (`Building`, `Floor`, `Unit`), queries can filter directly on `where: { communityId }` or `where: { organizationId }` with single-column B-Tree indexes, eliminating high-latency recursive JOINs.
2. **Deterministic Multi-Tenancy**: Data isolation policies can be applied unconditionally at the repository level with guaranteed index hits.
