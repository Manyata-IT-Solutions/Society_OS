# Handling Flexible & Optional Hierarchy Levels

## 1. Multi-Typology Property Archetypes

Community OS is designed to model distinct real-world residential topologies seamlessly:

### Archetype A: High-Rise Tower Community

- `Community → Building (Tower) → Floor → Unit`
- No `CommunitySection` required.

### Archetype B: Master-Planned Multi-Phase Township

- `Community → Section (Phase 1 / Sector A) → Building (Tower A) → Floor → Unit`
- Both `Section` and `Building` populated.

### Archetype C: Gated Luxury Villa Community

- `Community → Section (Lakeview Enclave) → Unit (Villa 1)`
- No `Building` or `Floor` entities used. The unit links directly to `sectionId` with `buildingId = null` and `floorId = null`.

### Archetype D: Row House / Townhouse Cluster

- `Community → Building (Row House Block 1) → Unit (Row House 101)`
- Single level or multi-level floors optional.

---

## 2. Parent-Child Integrity Engine

The `PropertyHierarchyService.validateParentConsistency` service method validates all parent-child associations at the domain layer prior to persistence:

1. **Cross-Community Mismatch Prevention**: A section, building, or floor cannot belong to a community different from the target unit.
2. **Section Alignment**: If a unit specifies both a `sectionId` and a `buildingId`, the building's `sectionId` must match the provided `sectionId`.
3. **Floor-Building Constraint**: A unit cannot have a `floorId` if `buildingId` is null, and the floor must belong directly to the specified building.
