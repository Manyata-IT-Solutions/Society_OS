# Enterprise Property Hierarchy Model

## 1. Overview & Architectural Scope

Community OS is designed to model any real-world physical and organizational structure without code alterations or schema re-engineering. The property hierarchy forms the physical backbone of the platform, enabling operations across small standalone societies, high-rise gated towers, and multi-thousand-unit township master plans.

```mermaid
graph TD
    Platform[Platform Control Plane] --> Org[Organization]
    Org --> Portfolio[Portfolio (Optional Multi-Community Grouping)]
    Org --> Community[Community / Society / Township]
    Portfolio -.-> Community
    Community --> Section[Community Section / Phase / Sector / Cluster (Optional)]
    Community --> BuildingDirect[Standalone Building / Tower]
    Community --> UnitDirect[Standalone Unit / Villa]
    Section --> Building[Building / Tower / Wing / Row House Block]
    Section --> SectionUnit[Section Unit / Villa]
    Building --> Floor[Floor Level (e.g., G, 1, 2, PH)]
    Floor --> Unit[Residential / Commercial Unit]
```

---

## 2. Canonical Hierarchy Entities

| Entity Level  | Database Model     | Purpose                                                                                         | Optionality  |
| :------------ | :----------------- | :---------------------------------------------------------------------------------------------- | :----------- |
| **Portfolio** | `Portfolio`        | Enterprise grouping of communities by city, region, or business division under an Organization. | Optional     |
| **Community** | `Community`        | Operational tenant root (e.g. Green Valley Township, Palm Heights Residences).                  | **Required** |
| **Section**   | `CommunitySection` | Physical or developmental zone (Phase 1, Sector 4, Lakeview Enclave).                           | Optional     |
| **Building**  | `Building`         | Vertical or horizontal structural enclosure (Tower A, Wing B, Block 1, Row House Cluster).      | Optional     |
| **Floor**     | `Floor`            | Alphanumeric vertical division (`B2`, `G`, `M`, `1`, `PH`) with explicit sorting.               | Optional     |
| **Unit**      | `Unit`             | Physical residential or commercial space with unique addressing within building/community.      | **Required** |

---

## 3. Strict Phase 3 Boundary Principles

In accordance with enterprise separation of concerns:

- **No Resident Master**: Resident identities, household relationships, occupancy logs, and family trees are deferred to Phase 4 (Resident Experience & Identity).
- **No Financial Attributes**: Maintenance tariffs, billing rates, opening balances, ledgers, and invoice references are deferred to the Financial Management module.
- **Physical Demarcation Only**: Units strictly store physical dimensions (`carpetArea`, `builtUpArea`, `superBuiltUpArea`, `areaUnit`), configuration (`bedroomCount`, `bathroomCount`, `unitType`), and lifecycle status (`PLANNED`, `UNDER_CONSTRUCTION`, `READY`, `ACTIVE`, `INACTIVE`, `ARCHIVED`).
