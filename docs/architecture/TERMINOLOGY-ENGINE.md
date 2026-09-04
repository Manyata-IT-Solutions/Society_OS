# Terminology & Display Templates Architecture

## Overview

The **Terminology Engine** resolves regional and property-specific display terminology dynamically to present familiar nomenclature to users while preserving canonical database models.

## Canonical vs Display Mapping

| Canonical Model Entity | Default Platform Label | Common Overrides                            |
| ---------------------- | ---------------------- | ------------------------------------------- |
| `Section`              | Section                | Phase, Sector, Zone, Block, Cluster         |
| `Building`             | Building               | Tower, Block, Wing, Villa, Structure        |
| `Unit`                 | Unit                   | Flat, Apartment, Suite, Villa, Office, Room |

## Resolution Flow

1. Core tables, APIs, foreign keys, and event payloads use canonical domain names (`Unit`, `Building`, `Section`).
2. Client applications (such as Admin Web and Resident Mobile) query `/api/v1/terminology` providing `organizationId` and `communityId`.
3. The UI components display resolved labels (e.g. "Tower A - Flat 101" instead of "Building A - Unit 101") across breadcrumbs, tables, and management forms.
