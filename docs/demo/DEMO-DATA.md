# COMMUNITY OS — ENTERPRISE DEMO DATASET GUIDE

**Phase 25.5B — Full Connected Enterprise Demo Data Seed**

---

## 1. Executive Summary & Operational Story

The **Community OS Demo Dataset** provides a rich, interconnected, and coherent operational environment spanning all 25 implemented phases. The dataset models **Northstar Community Management Pvt. Ltd.** managing **Green Valley Heights (GVH)**, a high-rise residential gated community in Indore, Madhya Pradesh.

Every entity is logically connected across domains:
- **Unit Occupants** submit **Helpdesk Tickets**.
- **Tickets** generate **Work Orders** and **Inventory Parts Requisitions**.
- **Vendors** supply spare parts through **Purchase Orders** and **Goods Receipt Notes (GRN)**.
- **Facility Assets** (Lifts, DG Sets, Fire Pumps, Solar PV) track **Operating Meters & Daily Telemetry**.
- **Monthly Maintenance Billing** runs across 6 billing periods (May–Oct 2026) generating **Invoices**, **UPI Payments**, and **Balanced General Ledger Journals**.
- **Governance Management Committees** hold **AGM/EGM Meetings**, pass statutory **Resolutions**, and publish **Notices & Policies**.
- **Smart Utility Gateways** record multi-month daily power and water consumption.
- **Security Gates** verify **Pre-Approved Visitor Passes** and log entries/exits in real-time.

---

## 2. Multi-Tenant Hierarchy

| Level | Name | Code / Slug | Key Attributes |
| :--- | :--- | :--- | :--- |
| **Organization** | Northstar Community Management Pvt. Ltd. | `northstar-community-mgmt` | Currency: `INR (₹)`, Timezone: `Asia/Kolkata`, Locale: `en-IN` |
| **Portfolio** | Indore Premium Residential Portfolio | `indore-residential-portfolio` | Multi-society cluster benchmark |
| **Primary Community** | Green Valley Heights | `GVH` (`green-valley-heights`) | 4 Towers, 144 Units, ~300+ Residents |
| **Benchmark Community 1** | Lakeview Residency | `LVR` (`lakeview-residency`) | Scheme 78, Indore |
| **Benchmark Community 2** | Palm Grove Enclave | `PGE` (`palm-grove-enclave`) | Rau Road, Indore |

---

## 3. Demo Persona Logins

All demo persona accounts share the unified development password:
> **Password**: `Admin@CommunityOS2026!`

| # | Persona / Role | Email | Phone | Target Modules / Story |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Platform Super Admin** | `admin@demo.local` | `+91 88100 00001` | Full system control, multi-tenancy, cross-org analytics |
| 2 | **Org Executive Director** | `orgadmin@northstar.demo` | `+91 88100 00002` | Portfolio KPI command center, organizational audits |
| 3 | **Community General Manager** | `manager.gvh@northstar.demo` | `+91 88100 00003` | Community dashboard, approvals, operations oversight |
| 4 | **Finance Manager** | `finance@northstar.demo` | `+91 88100 00004` | Chart of Accounts, AOP budget, GL journals, AP vouchers |
| 5 | **Senior Accountant** | `accountant.gvh@northstar.demo` | `+91 88100 00005` | Monthly billing runs, invoice clearing, bank reconciliations |
| 6 | **Facility Manager** | `facility.gvh@northstar.demo` | `+91 88100 00006` | Asset management, preventive maintenance schedules, checklists |
| 7 | **Helpdesk Lead** | `helpdesk.gvh@northstar.demo` | `+91 88100 00007` | Ticket triaging, SLA monitoring, agent assignments |
| 8 | **Lead Electrician** | `tech.electric@northstar.demo` | `+91 88100 00008` | Electrical work order execution, parts consumption |
| 9 | **Senior Plumber** | `tech.plumb@northstar.demo` | `+91 88100 00009` | Plumbing work orders, water pump inspections |
| 10 | **Security Chief** | `security.lead@northstar.demo` | `+91 88100 00010` | Gate pass control, shift rosters, incident investigation |
| 11 | **North Gate Guard** | `guard.north@northstar.demo` | `+91 88100 00011` | Visitor check-in/out, pass scanning, cab logging |
| 12 | **Storekeeper** | `store.manager@northstar.demo` | `+91 88100 00012` | Inventory stock receipts, issue slips, bin management |
| 13 | **Procurement Lead** | `procurement@northstar.demo` | `+91 88100 00013` | PR approvals, RFQ bidding, PO issuance, 3-way match |
| 14 | **Capex Projects Head** | `projects.lead@northstar.demo` | `+91 88100 00014` | Solar PV installation, milestone payments, retentions |
| 15 | **HR & Workforce Lead** | `hr.workforce@northstar.demo` | `+91 88100 00015` | Staff engagements, skill matrix, biometric rosters |
| 16 | **RWA / MC President** | `president.rwa@demo.local` | `+91 88100 00016` | AGM agenda, resolution voting, society executive policies |
| 17 | **RWA / MC Secretary** | `secretary.rwa@demo.local` | `+91 88100 00017` | Meeting minutes, official notice board, statutory records |
| 18 | **Resident Owner (A-405)** | `resident.owner@demo.local` | `+91 88100 00018` | Maintenance dues payment, amenity booking, helpdesk tickets |
| 19 | **Resident Tenant (C-602)** | `resident.tenant@demo.local` | `+91 88100 00019` | Visitor pass generation, amenity access, tenancy profile |
| 20 | **Safety & Compliance Officer** | `safety.compliance@northstar.demo` | `+91 88100 00020` | Fire safety NOC, Lift licenses, hazard CAPA registry |

---

## 4. Property Hierarchy & Residential Master

- **Sections**:
  - `Phase 1 - Meadowlands` (Towers A & B, Central Clubhouse, Main North Gate)
  - `Phase 2 - Hillcrest` (Towers C & D, Sports Arena, Solar Array)
- **Buildings & Towers**:
  - **Tower A (Aspen)**: 10 Floors (Floor G to Floor 9), 40 Units (`A-G01` to `A-904`)
  - **Tower B (Birch)**: 10 Floors (Floor G to Floor 9), 40 Units (`B-G01` to `B-904`)
  - **Tower C (Cedar)**: 10 Floors (Floor G to Floor 9), 40 Units (`C-G01` to `C-904`)
  - **Tower D (Dogwood)**: 6 Floors (Floor G to Floor 5), 24 Units (`D-G01` to `D-504`)
- **Total Units**: **144 Residential Units** (1BHK: 1250 sqft, 2BHK: 1750 sqft, 3BHK: 1850 sqft, 4BHK: 2450 sqft).
- **Occupancy Distribution**:
  - **105 Owner-Occupied Households**
  - **27 Tenant-Occupied Households**
  - **12 Vacant Units**
- **Residents**: **300+ Verified Resident Profiles** with realistic Indian names, distinct contact numbers, family relationships, vehicle records, and subledgers.

---

## 5. Domain Summary Matrix (Phases 0–25)

| Domain | Records Populated | Key Features Demonstrated |
| :--- | :--- | :--- |
| **Phases 0–2: IAM & RBAC** | 167 Users, 426 Permissions | 20 Demo Personas, Scoped Organization/Community Memberships |
| **Phases 3–4: Property & Occupancy** | 500+ Units, 300+ Households | Full hierarchy from Section -> Building -> Floor -> Unit -> Household -> Resident |
| **Phase 8: Helpdesk & Ticketing** | 165 Tickets across 16 Categories | SLA tracking (On-Track, Breached), State workflows (New, In Progress, Resolved, Closed) |
| **Phase 9: Work Orders & PM** | 124 Work Orders, PM Plans | Corrective actions, technician assignment, supervisor verification |
| **Phase 10: Asset Management** | 52 Physical Assets, 10 Meters | Schindler Lifts, Cummins DG, Kirloskar Fire Pumps, 540+ Daily Readings |
| **Phase 11: Inventory & Stores** | 28 Stores, 54 Catalog Items | Central Store, Electrical, Plumbing, Stock balances and transactions |
| **Phases 13–15: Finance & Billing** | 26 Periods, 1344 Invoices, 1037 Payments | 6 Months billing (May–Oct 2026), 92% collection rate, UPI receipts, General Ledger |
| **Phase 16: Budgeting & AOP** | FY2026-27 AOP Budget Lines | Commitments, actuals, variance explanations, sinking fund reserves |
| **Phase 18: Security & Visitors** | 2 Gates, 163 Visitor Passes | Pre-approved QR invitations, Delivery / Guest / Cab entries, Check-outs |
| **Phase 19: Parking & Vehicles** | 4 Areas, 67 Slots, 62 Vehicles | Basement 1, EV charging slots, unit-linked allocations, RFID tags |
| **Phase 20: Amenities & Bookings** | 14 Amenities, Booking Policies | Clubhouse, Olympic Pool, Gym, Badminton Courts, Banquet Hall, Guest Suites |
| **Phase 21: Staff & Workforce** | 3 Departments, Job Roles, Rosters | Engineering, Security, Facility staff, morning/night shift deployments |
| **Phase 22: Governance & AGM** | 4 Meetings, Resolutions, 6 Notices | AGM 2026, EGM on Solar Capex, Managing Committee minutes, official notices |
| **Phase 25: Analytics & Governed AI** | Metric snapshots & Search Docs | Global search documents indexed across Communities, Tickets, Assets, Policies |

---

## 6. Seed, Reset & Reseed Commands

| Command | Action |
| :--- | :--- |
| `pnpm demo:seed` | Executes baseline permissions and full connected enterprise demo dataset. |
| `pnpm demo:reseed` | Re-executes the complete seed cleanly over existing database. |
| `pnpm demo:reset` | Resets all database tables and repopulates the full enterprise demo dataset from scratch. |

---

## 7. Verified Screens Matrix

| Route | Expected Data & Verification |
| :--- | :--- |
| `/app` | Organization overview, community selector, live metrics |
| `/app/users` | 20 Demo Personas and 160+ resident user accounts |
| `/app/units` | 144 Units across Towers A, B, C, D with occupancy badges |
| `/app/residents` | 300+ Residents with phone, email, household ties |
| `/app/helpdesk` | 165 Tickets categorized with SLA status and priority filters |
| `/app/work-orders` | 124 Work Orders linked to helpdesk tickets and technicians |
| `/app/billing` | 6 Billing Periods (May–Oct 2026), Invoices, Receipts, Payment ledger |
| `/app/inventory` | Central Engineering Store, electrical/plumbing stock balances |
| `/app/assets` | Elevators, 500kVA DG Sets, Fire Pumps, Solar Inverters |
| `/app/parking` | Basement 1 & 2 layout, EV charging slots, vehicle allocations |
| `/app/amenities` | Clubhouse, Pool, Gym, Badminton, Banquet Hall booking policies |
| `/app/governance` | AGM 2026, EGM Solar meeting, passed resolutions, published notices |
| `/app/visitors` | Pre-approved visitor invitations and completed check-ins |
| `/app/search` | Unified search across tickets, assets, residents, policies |
| `/app/analytics` | Cross-domain executive KPI command center and BI metrics |

---
