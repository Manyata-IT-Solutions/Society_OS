# Community OS: Project Goals, Architecture & Functional Coverage Guide

> **Enterprise Residential Community ERP, Society Management Platform, Facility Management System, and Multi-Property SaaS Operating System.**

---

## 1. Executive Summary & Core Mission

**Community OS** is built to solve the operational, financial, and governance complexities of modern community living and facility management. It transitions residential societies and commercial townships away from fragmented spreadsheets, paper registers, and disconnected point solutions into a single, unified, enterprise-grade operating system.

### Core Objectives
1. **Multi-Tenant Scale**: Support single residential buildings, gated high-rises, commercial business parks, and 10,000+ unit mega-townships under a multi-level hierarchy (**Organization → Portfolio → Community → Block → Unit**).
2. **Audit-Grade Financial Integrity**: Built-in double-entry ledger accounting, automated billing cycles, payment reconciliation, maintenance dues collection, and strict financial audit trails.
3. **Operational Autonomy**: End-to-end facility management including asset lifecycles, preventive maintenance schedules, utility meter tracking (Power, Water, DG, Solar), and vendor service agreements.
4. **Governance & Resident Experience**: Transparent AGM/EGM committee administration, compliant voting/polling, SLA-driven resident helpdesks, and emergency safety protocols.
5. **Modern Developer & Cloud Experience**: Containerized architecture running entirely via Docker with hot-reloading, live volume mounts, zero-downtime token refresh, and strict TypeScript types.

---

## 2. System Architecture & Tech Stack

Community OS is engineered as a **Modular Monolith** applying **Domain-Driven Design (DDD)** and **Clean Architecture** patterns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Web Experience Layer (Frontend)                      │
│        apps/admin-web (Next.js 14 App Router, Tailwind CSS, Lucide)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / OpenAPI / JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API Gateway & Domain Engine (Backend)               │
│          apps/api (NestJS Modular Monolith, Swagger, Guards)           │
│                                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   Identity   │ │   Property   │ │   Finance    │ │   Workforce  │  │
│  │   & Access   │ │  Hierarchy   │ │  Accounting  │ │  & Roster    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  Utilities   │ │    Safety    │ │  Governance  │ │  Analytics   │  │
│  │   & Meters   │ │ & Compliance │ │ & Committees │ │     & AI     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Shared Libraries & Monorepo Packages                  │
│   packages/database (Prisma ORM)  •  packages/auth (RBAC/JWT)          │
│   packages/types                  •  packages/contracts (DTOs)         │
│   packages/validation (Zod)       •  packages/events (Event Bus)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      Infrastructure & Persistence                      │
│      PostgreSQL 16 (Relational DB)   •   Redis 7 (Cache / BullMQ)      │
│                     Docker & Docker Compose Dev Stack                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix
| Layer | Technologies Used | Key Responsibilities |
|---|---|---|
| **Frontend Console** | Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons | Admin ERP console, dynamic forms, data tables, responsive modals |
| **Backend API** | NestJS 10, TypeScript 5.8+, Express, Class-Validator, Swagger | 80+ REST endpoints, RBAC guards, transactional business services |
| **Data Layer** | PostgreSQL 16, Prisma ORM 6.4+, Redis 7 | Relational system of record, transactional safety, caching, queues |
| **Security** | JWT (Dual-token: 15m Access + 7d Refresh), Bcrypt, Role-Based Access Control | Strict authentication, silent background refresh, auto-logout |
| **Environment** | Docker, Docker Compose, Alpine Linux, pnpm Monorepo | Containerized execution, host volume live reload, zero build friction |

---

## 3. What is Covered: Functional Domain Breakdown

Community OS spans **9 Comprehensive Operational Pillars**:

```
                                  COMMUNITY OS
                                       │
     ┌──────────────┬──────────────┼──────────────┬──────────────┐
     │              │              │              │              │
 1. CORE &      2. IAM &       3. FINANCIAL    4. FACILITY    5. WORKFORCE
  PROPERTY       ACCESS          ERP & GL       & ASSETS       & ROSTER
     │              │              │              │              │
     ├──────────────┴──────────────┼──────────────┴──────────────┤
     │                             │                             │
 6. HELPDESK &                 7. GOVERNANCE                 8. SAFETY &
  RESIDENT                      & COMMITTEES                  COMPLIANCE
     │                             │                             │
     └─────────────────────────────┴─────────────────────────────┘
                                   │
                      9. AUTOMATION, AI & ANALYTICS
```

### Pillar 1: Core & Property Hierarchy
* **Multi-Tenant Scoping**: Global Organization → Portfolios → Communities / Societies.
* **Granular Physical Hierarchy**: Blocks / Towers → Floors → Individual Units / Flats.
* **Unit Attributes**: Carpet area, super built-up area, ownership type (Owner vs Tenant occupied), occupancy status.
* **Parking & Amenity Allocation**: Dedicated parking slots, clubhouse spaces, recreational grounds.

### Pillar 2: Identity & Access Management (IAM)
* **User Directory**: Central identity registry with emails, contact details, and role assignments.
* **Scoped Memberships**: Granular permissions scoped at Platform, Organization, or specific Society level.
* **Active Session Management**: Track user devices, IP addresses, session start times, and revoke sessions on-demand.
* **Silent Token Lifecycles**: Automatic 401 interception to silently exchange refresh tokens with zero user disruption.

### Pillar 3: Financial ERP & Double-Entry Accounting
* **Chart of Accounts (COA)**: Standardized accounts with account codes, account types (Asset, Liability, Equity, Revenue, Expense), and normal balance rules.
* **General Ledger & Journal Vouchers**: Real-time balanced journal entries (`Debit == Credit`) with audit trails.
* **Billing & Dues Management**: Maintenance fee schedules, interest calculations on delayed dues, and receipt generation.
* **Budgeting & Capex Control**: Fiscal period budget allocation, expense variance monitoring, and capital fund management.

### Pillar 4: Facility & Asset Lifecycle Management
* **Asset Registry**: Machinery, elevators, generators, water pumps, HVAC units, fire suppression systems, and warranty expirations.
* **Preventive Maintenance**: Scheduled recurring service checklists, work orders, and technician assignments.
* **Utility Metering & Sub-Metering**:
  * **Electric & Energy**: Grid meters, DG set runtime tracking (fuel liters vs kWh generated), solar net metering.
  * **Water Tracking**: Sub-meter readings, tanker delivery logs (vendor, challan number, capacity KL, cost).
  * **Tariff Management**: Slab-based tariff plans, time-of-day rates, and fixed charges.
* **Outage Management**: Planned and emergency utility outage notifications and scheduled restoration logs.

### Pillar 5: Workforce & Security Management
* **Worker Profiles**: In-house staff and outsourced agency personnel (Security, Housekeeping, Electrical, Gardening).
* **Trade Licenses & Skill Verification**: Track worker certifications, IDs, and license expiration dates.
* **Shift Rostering & Attendance**: Shift period planning, shift rotations, daily attendance logs, and **Instant CSV export**.
* **Task Checklists**: Shift-based routine inspection and cleaning checklists.

### Pillar 6: Helpdesk, Complaints & Resident Services
* **Ticketing System**: Categorized resident service requests (Plumbing, Electrical, Carpentry, Noise, Security).
* **SLA Escalation Matrix**: Turnaround time tracking with automated SLA breach status.
* **Resident Portal Integration**: Self-service complaint logging, status tracking, and technician rating.

### Pillar 7: Governance, Legal & Society Administration
* **Committee Structure**: Managing committee, sub-committees, assigned roles (President, Secretary, Treasurer), and terms.
* **Meeting Management**: AGM / EGM scheduling, agenda items, quorum validation, and official minutes of meeting (MoM).
* **Resolution & Voting**: Digital polling, member voting records, and resolution tracking.

### Pillar 8: Safety, Health & Emergency Compliance
* **Regulatory Compliance**: Fire safety, environmental clearances, lift licenses, structural audit tracking.
* **Emergency Preparedness**: Evacuation zones, designated assembly points, building wardens, and drill logs.
* **Incident & Hazard Reporting**: Near-miss and accident incident reports with severity classifications.
* **SOS Dispatch Simulation**: Security console dispatch simulations for medical, fire, or security emergencies.

### Pillar 9: Automation, Intelligence & Analytics
* **Custom Reporting**: Financial summaries, occupancy statistics, utility consumption trends, and workforce utilization.
* **AI-Assisted Search**: Context-aware queries across society documents, bylaws, circulars, and historical notices.
* **Comprehensive Audit Trail**: Tamper-evident logging of system actions with user IDs, timestamps, and change diffs.

---

## 4. Step-by-Step Implementation Progress (What Has Been Achieved)

### Step 1: Infrastructure & Container Setup
- [x] Initialized PostgreSQL 16 container with persistent volumes and healthchecks.
- [x] Initialized Redis 7 container for high-speed caching and queues.
- [x] Configured Docker Compose network with bridged isolation (`community_os_network`).
- [x] Enabled live host volume mounts (`apps/admin-web/src` and `apps/api/src`) for zero-rebuild hot reload.

### Step 2: Database Modeling & Seeding
- [x] Comprehensive Prisma schema (`schema.prisma`) modeling organizations, properties, units, accounts, workforce, and meters.
- [x] Multi-tier seeders:
  - Default Platform Superadmin (`admin@communityos.io` / `Admin@CommunityOS2026!`).
  - Demo Organization (`Apex Horizon Group`).
  - Demo Society (`Azure Heights Residency`) with blocks, units, and initial accounts.

### Step 3: API Backend Engine
- [x] Built modular controllers for Auth, Organizations, Properties, Users, Roles, Finance, Workforce, Utilities, Safety, and Governance.
- [x] Interactive OpenAPI Swagger documentation live at `http://localhost:4000/api/v1/docs`.
- [x] Request context tracking with correlation IDs (`x-request-id`) and structured Pino logging.

### Step 4: Admin Web Shell & Responsive Layout
- [x] Next.js 14 App Router administration shell with modern dark-surface contrast.
- [x] Responsive collapsible sidebar with organization / platform switcher.
- [x] Clean removal of native browser scrollbars (`no-scrollbar`) while maintaining smooth wheel scrolling.
- [x] Instant optimistic navigation (`onPointerDown`) with hover prefetching and glowing top progress indicators.

### Step 5: Full Interactivity across Action Headers (24 Modals Implemented)
- [x] **Finance**: Add Account modal, Record Journal Voucher modal.
- [x] **Governance**: Create Committee modal, Schedule Meeting modal.
- [x] **Workforce**: Add Worker modal, Export Daily Attendance CSV, Create Roster Period modal, Add Skill/License modal, Create Task Checklist modal.
- [x] **Utilities**: Register Meter modal, Record Meter Reading modal, Record DG Run modal, Record Tanker Delivery modal, Schedule Utility Outage modal, Create Tariff Plan modal.
- [x] **Safety**: Add Compliance Requirement modal, Register Credential modal, Plan Emergency Drill modal, Add Evacuation Zone modal, Report Hazard modal, Report Incident modal, Schedule Inspection modal, Simulate Emergency SOS modal.
- [x] **Analytics**: Build Custom Analytical Report modal.

### Step 6: Session Resilience & Security
- [x] Dual-token authentication with automatic 401 token refresh interceptor.
- [x] Request deduplication during session refresh.
- [x] Auto-logout fallback with user-friendly session expiry banner on `/login?expired=1`.

---

## 5. Quick Reference & Operational Guide

### Default Service URLs
| Service | URL | Purpose |
|---|---|---|
| **Admin Web Console** | `http://localhost:3000` | Full administrative ERP web interface |
| **API Server** | `http://localhost:4000/api/v1` | REST API Gateway |
| **Swagger Documentation** | `http://localhost:4000/api/v1/docs` | Interactive OpenAPI documentation |
| **PostgreSQL Database** | `localhost:5434` (DB: `community_os_dev`) | Primary relational database |
| **Redis Server** | `localhost:6379` | Cache and queue engine |

### Default Credentials
* **Email**: `admin@communityos.io`
* **Password**: `Admin@CommunityOS2026!`

### Common Commands
```bash
# Start all containers in background
docker compose up -d

# View real-time logs for a specific service
docker compose logs -f admin-web
docker compose logs -f api

# Rebuild a service after installing new npm dependencies
docker compose build admin-web
docker compose up -d admin-web

# Run automated tests
pnpm --filter @community-os/admin-web test

# Run TypeScript typechecks
pnpm --filter @community-os/admin-web typecheck
```
