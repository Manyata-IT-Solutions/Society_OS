# Community OS — Full Product Walkthrough Matrix (Phase 25.5C)

This matrix documents the runtime verification of every major screen, role experience, API integration, data visibility, error states, and cross-module linkages across the 28 implemented domains.

**Status Legend**:
- `VERIFIED`: Screen loads with real database data, actions/modals operate correctly, console is clean, and API responses are valid.
- `PARTIAL`: Screen functions but minor non-blocking styling or UX optimization is pending for Phase 25.5E.
- `FAILED`: Critical blocker or error prevents screen from functioning.
- `BLOCKED`: Blocked by an upstream requirement.
- `N/A`: Action or sub-feature not applicable to this screen's functional scope.

---

## 1. Platform Core & Property Hierarchy Master

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Core | Authentication | `/login` | Public / All | `POST /auth/login` | Yes | Yes | N/A | N/A | Submit | Public | Skeleton | Handled | Clean | **VERIFIED** |
| Core | Platform Overview | `/app` | Platform Admin | `GET /property/hierarchy` | Yes | Yes | N/A | N/A | Navigate | System Admin | Handled | Handled | Clean | **VERIFIED** |
| Property | Organizations | `/app/organizations` | Platform Admin | `GET /organizations` | Yes (2 Orgs) | Yes | Yes | N/A | Filter | Org Admin | Handled | Handled | Clean | **VERIFIED** |
| Property | Portfolios | `/app/portfolios` | Org Admin | `GET /organizations/:id/portfolios` | Yes (23 Portfolios) | Yes | Yes | N/A | Create Card | Org Admin | Handled | Handled | Clean | **VERIFIED** |
| Property | Communities | `/app/organizations` (`/app/communities` redirects) | Community Admin | `GET /property/communities` | Yes (5 Comm.) | Yes | Yes | Yes | Switch | Comm Admin | Handled | Handled | Clean | **VERIFIED** |
| Property | Towers & Blocks | `/app/communities/[id]/towers/[towerId]` | Community Mgr | `GET /property/buildings/:id` | Yes (4 Towers) | Yes | Yes | N/A | Floor Grid | Comm Admin | Handled | Handled | Clean | **VERIFIED** |
| Property | Units 360 | `/app/communities/[id]/units/[unitId]` | Community Mgr | `GET /property/units/:id` | Yes (504 Units) | Yes | Yes | Yes | Occupancy Link | Comm Admin | Handled | Handled | Clean | **VERIFIED** |

---

## 2. Identity & Access Management (IAM)

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| IAM | User Directory | `/app/users` | Platform Admin | `GET /users` | Yes (167 Users) | Yes | Yes | Yes | Reset Pwd | IAM Admin | Handled | Handled | Clean | **VERIFIED** |
| IAM | Tenant Memberships | `/app/memberships` | Org Admin | `GET /memberships` | Yes | Yes | Yes | Yes | Scope Assign | IAM Admin | Handled | Handled | Clean | **VERIFIED** |
| IAM | Roles & Permissions| `/app/roles` | Platform Admin | `GET /roles` | Yes (426 Perms) | Yes | Yes | Yes | Matrix View | IAM Admin | Handled | Handled | Clean | **VERIFIED** |
| IAM | Role Assignments | `/app/role-assignments` | Org Admin | `GET /role-assignments` | Yes | Yes | Yes | Yes | Revoke | IAM Admin | Handled | Handled | Clean | **VERIFIED** |
| IAM | Active Sessions | `/app/sessions` | Platform Admin | `GET /sessions` | Yes | Yes | N/A | N/A | Force Terminate | IAM Admin | Handled | Handled | Clean | **VERIFIED** |

---

## 3. Financial ERP & General Ledger

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Finance | Chart of Accounts | `/app/finance/accounts` | Finance Mgr | `GET /finance/accounts` | Yes (16 Accounts) | Yes | Yes | Yes | Add Account | Finance Lead | Handled | Handled | Clean | **VERIFIED** |
| Finance | Journal Vouchers | `/app/finance/journals` | Accountant | `GET /finance/journals` | Yes (Balanced JVs) | Yes | Yes | N/A | Post Voucher | Accountant | Handled | Handled | Clean | **VERIFIED** |
| Finance | Trial Balance | `/app/finance/trial-balance` | Finance Mgr | `GET /finance/trial-balance` | Yes (Balanced Dr=Cr)| Yes | N/A | N/A | Export / Print | Finance Lead | Handled | Handled | Clean | **VERIFIED** |
| Finance | Fiscal Periods | `/app/finance/periods` | Finance Mgr | `GET /finance/periods` | Yes (12 Months) | Yes | Yes | Yes | Close Period | Finance Lead | Handled | Handled | Clean | **VERIFIED** |

---

## 4. Maintenance Billing & Accounts Receivable (AR)

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Billing | Billing Dashboard | `/app/billing` | Accountant | `GET /billing/summary` | Yes | Yes | N/A | N/A | Aging View | Finance Ops | Handled | Handled | Clean | **VERIFIED** |
| Billing | Monthly Runs | `/app/billing/runs` | Finance Mgr | `GET /billing/runs` | Yes (6 Runs) | Yes | Yes | N/A | Execute Run | Finance Lead | Handled | Handled | Clean | **VERIFIED** |
| Billing | Invoices Registry | `/app/billing/invoices` | Accountant | `GET /billing/invoices` | Yes (2,028 Invoices)| Yes | Yes | N/A | View PDF | Finance Ops | Handled | Handled | Clean | **VERIFIED** |
| Billing | Payments & Receipts| `/app/billing/payments` | Accountant | `GET /billing/payments` | Yes (UPI Receipts) | Yes | Yes | N/A | Reconcile | Finance Ops | Handled | Handled | Clean | **VERIFIED** |

---

## 5. Helpdesk, Service Tickets & Work Orders

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Helpdesk | Helpdesk Command | `/app/helpdesk` | Helpdesk Mgr | `GET /helpdesk/summary` | Yes | Yes | N/A | N/A | Triage | Helpdesk Lead| Handled | Handled | Clean | **VERIFIED** |
| Helpdesk | Tickets Queue | `/app/helpdesk/tickets` | Helpdesk Lead | `GET /helpdesk/tickets` | Yes (325 Tickets) | Yes | Yes | Yes | Assign Agent | Helpdesk Ops | Handled | Handled | Clean | **VERIFIED** |
| Helpdesk | Ticket 360 Detail | `/app/helpdesk/tickets/[id]` | Technician | `GET /helpdesk/tickets/:id` | Yes | Yes | N/A | Yes | Create WorkOrder| Ops Team | Handled | Handled | Clean | **VERIFIED** |
| Facility | Work Orders Queue | `/app/facility/work-orders` | Facility Mgr | `GET /facility/work-orders` | Yes (234 Orders) | Yes | Yes | Yes | Assign Tech | Facility Lead| Handled | Handled | Clean | **VERIFIED** |
| Facility | Routine PM Plans | `/app/facility/maintenance-plans` (`/app/facility/preventive` redirects) | Facility Mgr | `GET /facility/pm-plans` | Yes (DG, Lift PM) | Yes | Yes | Yes | Trigger PM | Facility Lead| Handled | Handled | Clean | **VERIFIED** |

---

## 6. Physical Assets, Inventory & Spares

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Assets | Heavy Equipment | `/app/assets` | Facility Mgr | `GET /assets` | Yes (52 Assets) | Yes | Yes | Yes | Log Downtime | Facility Ops | Handled | Handled | Clean | **VERIFIED** |
| Assets | Asset 360 Detail | `/app/assets/[id]` | Technician | `GET /assets/:id` | Yes | Yes | N/A | Yes | View AMC | Facility Ops | Handled | Handled | Clean | **VERIFIED** |
| Inventory | Stock Balances | `/app/inventory/balances` | Storekeeper | `GET /inventory/balances` | Yes (Spares/Parts) | Yes | Yes | Yes | Reorder Alert| Stores Lead | Handled | Handled | Clean | **VERIFIED** |
| Inventory | Material Receipts | `/app/inventory/receipts` | Storekeeper | `GET /inventory/receipts` | Yes (GRN logs) | Yes | Yes | N/A | Inward Stock | Stores Lead | Handled | Handled | Clean | **VERIFIED** |
| Inventory | Material Issues | `/app/inventory/issues` | Technician | `GET /inventory/issues` | Yes (WO Spares) | Yes | Yes | N/A | Issue to WO | Stores Lead | Handled | Handled | Clean | **VERIFIED** |

---

## 7. Security, Gate & Visitor Access

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Security | Guard Post Console | `/app/security/gate-app` | Security Guard | `GET /security/gates` | Yes (Gates 1, 2) | Yes | Yes | N/A | Fast Check-in| Guard Staff | Handled | Handled | Clean | **VERIFIED** |
| Security | Visitor Passes | `/app/security/visitors` | Security Chief | `GET /security/visitors` | Yes (168 Passes) | Yes | Yes | Yes | Pre-approve | Resident/Guard| Handled | Handled | Clean | **VERIFIED** |
| Security | Active On-Premise | `/app/security/active` | Security Guard | `GET /security/active` | Yes | Yes | N/A | N/A | Log Exit | Guard Staff | Handled | Handled | Clean | **VERIFIED** |
| Parking | Bay Allocations | `/app/parking/allocations` | Security Chief | `GET /parking/allocations` | Yes (4 Towers) | Yes | Yes | Yes | Allocate Bay | Security Ops | Handled | Handled | Clean | **VERIFIED** |
| Parking | Vehicle Registry | `/app/parking/vehicles` | Security Guard | `GET /parking/vehicles` | Yes (FastTags) | Yes | Yes | Yes | Tag RFID | Security Ops | Handled | Handled | Clean | **VERIFIED** |

---

## 8. Workforce, Governance & Safety

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Workforce | Staff Directory | `/app/workforce/workers` | HR / Ops Lead | `GET /workforce/workers` | Yes (Staff/Vendor) | Yes | Yes | Yes | Add Worker | HR Admin | Handled | Handled | Clean | **VERIFIED** |
| Workforce | Shift Rostering | `/app/workforce/roster` | Workforce Mgr | `GET /workforce/rosters` | Yes (Shifts A/B/C)| Yes | Yes | Yes | Create Roster| Ops Lead | Handled | Handled | Clean | **VERIFIED** |
| Workforce | Trade Licenses | `/app/workforce/skills` | Workforce Mgr | `GET /workforce/skills` | Yes (Licensing) | Yes | Yes | Yes | Add License | Ops Lead | Handled | Handled | Clean | **VERIFIED** |
| Governance | Committees | `/app/governance/committees`| MC Secretary | `GET /governance/committees`| Yes (MC-2026) | Yes | Yes | Yes | Term Roster | Governance | Handled | Handled | Clean | **VERIFIED** |
| Governance | Meetings & Quorum | `/app/governance/meetings` | MC President | `GET /governance/meetings`| Yes (EGM, AGM) | Yes | Yes | Yes | Schedule Meet| Governance | Handled | Handled | Clean | **VERIFIED** |
| Governance | Voting & Ballots | `/app/governance/voting` | Resident Owner | `GET /governance/voting` | Yes (Resolutions) | Yes | Yes | N/A | Cast Ballot | Member Role | Handled | Handled | Clean | **VERIFIED** |
| Safety | Emergency SOS | `/app/safety/sos` | Security Lead | `GET /safety/sos` | Yes (Panic Dispatches)| Yes | Yes | N/A | Dispatch Alert| Emergency Ops| Handled | Handled | Clean | **VERIFIED** |
| Safety | Statutory Compliance| `/app/safety/compliance` | Safety Officer | `GET /safety/compliance` | Yes (Fire NOCs) | Yes | Yes | Yes | Add Req. | Safety Lead | Handled | Handled | Clean | **VERIFIED** |
| Safety | Hazards & CAPA | `/app/safety/hazards-risks`| Safety Officer | `GET /safety/hazards` | Yes (Risk Matrix) | Yes | Yes | Yes | Report Hazard| Safety Lead | Handled | Handled | Clean | **VERIFIED** |

---

## 9. Utilities & Plant Operations

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Utilities | Meter Registry | `/app/utilities/meters` | Utility Ops | `GET /utilities/meters` | Yes (10 Meters) | Yes | Yes | Yes | Register Meter| Facility Ops | Handled | Handled | Clean | **VERIFIED** |
| Utilities | Meter Readings | `/app/utilities/readings`| Meter Reader | `GET /utilities/readings` | Yes (1,160 Logs) | Yes | Yes | N/A | Record Reading| Ops Staff | Handled | Handled | Clean | **VERIFIED** |
| Utilities | DG Genset Operations| `/app/utilities/energy` | Electrician | `GET /utilities/energy` | Yes (Fuel/kWh) | Yes | Yes | N/A | Record DG Run| Technical Staff| Handled | Handled | Clean | **VERIFIED** |
| Utilities | Water Tanker Deliveries| `/app/utilities/water`| Plumber | `GET /utilities/water` | Yes (Tanker Logs) | Yes | Yes | N/A | Record Tanker | Technical Staff| Handled | Handled | Clean | **VERIFIED** |
| Utilities | Outages & Restorations| `/app/utilities/outages`| Community Mgr | `GET /utilities/outages` | Yes | Yes | Yes | Yes | Schedule Outage| Facility Mgr | Handled | Handled | Clean | **VERIFIED** |
| Utilities | Tariff Engine | `/app/utilities/tariffs` | Finance Mgr | `GET /utilities/tariffs` | Yes (Slabs) | Yes | Yes | Yes | Create Tariff| Finance Lead | Handled | Handled | Clean | **VERIFIED** |

---

## 10. Analytics, Search & Common Engines

| Module | Screen | Route | Role | API Endpoint | Data Present | View | Create | Edit | Action | Permission | Loading | Empty | Console | Result |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Analytics | Executive Dashboard | `/app/analytics` | Executive / GM | `GET /analytics/dashboard`| Yes | Yes | N/A | N/A | Date Range | Exec Role | Handled | Handled | Clean | **VERIFIED** |
| Analytics | Custom Report Builder| `/app/analytics/reports`| Analyst | `POST /analytics/reports` | Yes | Yes | Yes | N/A | Run Query | Analyst Role | Handled | Handled | Clean | **VERIFIED** |
| Search | Unified Search | `/app/search` | All Staff | `POST /search` | Yes (Indexed Docs)| Yes | N/A | N/A | Live Search | Authenticated| Handled | Handled | Clean | **VERIFIED** |
| Audit | Immutable Audit Trail| `/app/audit` | Compliance | `GET /audit` | Yes (User Actions)| Yes | N/A | N/A | Diff Inspector| Auditor | Handled | Handled | Clean | **VERIFIED** |
| Notification| System Broadcasts | `/app/notifications`| All Users | `GET /notifications` | Yes | Yes | Yes | N/A | Mark Read | Authenticated| Handled | Handled | Clean | **VERIFIED** |
