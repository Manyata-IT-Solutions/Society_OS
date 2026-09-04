# ADR 042: Community Display Terminology Resolution

## Status

Accepted

## Context

Real estate terminology differs by region and property type:

- "Building" vs "Tower", "Block", "Wing", "Villa"
- "Unit" vs "Flat", "Apartment", "Suite", "Villa", "Plot"
- "Section" vs "Phase", "Zone", "Sector", "Cluster"

Hardcoding these terms in the UI or schema creates friction for diverse property types.

## Decision

We resolved display terminology dynamically through the Configuration Engine:

1. Core domain entities remain strictly canonical (`Section`, `Building`, `Floor`, `Unit`).
2. Configurable configuration keys (`community.display.sectionLabel`, `community.display.buildingLabel`, `community.display.unitLabel`) resolve region/community-specific labels.
3. The Admin Web UI and API consumers consume the `/api/v1/terminology` endpoint to render labels dynamically while maintaining canonical database schemas.

## Consequences

### Positive

- Unified UI adaptivity for commercial, high-rise, gated villas, and mixed-use properties.
- Core business logic, APIs, and database migrations remain clean, stable, and canonical.
- Immediate UI reflection upon community-level configuration changes.

### Negative

- Frontend components must resolve terminology labels asynchronously or from cached context rather than using static strings.
