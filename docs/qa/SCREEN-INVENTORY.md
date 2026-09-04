# Community OS — Screen & Route Inventory (Phase 25.5C)

This document captures the complete inventory of all 142 frontend routes implemented in `apps/admin-web/src/app`.

---

## 1. Platform Core & Administration
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/login` | Authentication Portal | `app/login/page.tsx` | Multi-factor JWT login, tenant credentials |
| `/app` | Platform Command Center | `app/app/page.tsx` | Platform KPIs, system health, quick links |
| `/app/organizations` | Organizations Directory | `app/app/organizations/page.tsx` | Tenant Organizations, property counts, status |
| `/app/organizations/[id]` | Organization Detail | `app/app/organizations/[id]/page.tsx` | Communities hierarchy, organization profile |
| `/app/organizations/[id]/communities/new` | Create Community | `app/app/organizations/[id]/communities/new/page.tsx` | Community creation wizard |
| `/app/portfolios` | Enterprise Portfolios | `app/app/portfolios/page.tsx` | Regional portfolios, community grouping |
| `/app/profile` | User Profile | `app/app/profile/page.tsx` | User preferences, credentials, assigned roles |
| `/app/settings` | Platform Settings | `app/app/settings/page.tsx` | Global flags, system settings |

---

## 2. Identity & Access Management (IAM)
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/users` | User Directory | `app/app/users/page.tsx` | Platform users, contact info, status |
| `/app/memberships` | Tenant Memberships | `app/app/memberships/page.tsx` | Scoped organization & community memberships |
| `/app/roles` | Roles & Permissions | `app/app/roles/page.tsx` | System & custom role permission matrix |
| `/app/roles/new` | Create Role | `app/app/roles/new/page.tsx` | Custom role permission builder |
| `/app/role-assignments` | Role Assignments | `app/app/role-assignments/page.tsx` | Scoped user-role assignment grants |
| `/app/sessions` | Active Sessions | `app/app/sessions/page.tsx` | Token tracking, remote session revocation |

---

## 3. Shared Platform Engines
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/audit` | Audit Trail | `app/app/audit/page.tsx` | Immutable audit log, change diffs |
| `/app/notifications` | Notifications Center | `app/app/notifications/page.tsx` | User notifications, broadcast announcements |
| `/app/notifications/templates` | Notification Templates | `app/app/notifications/templates/page.tsx` | Notification delivery templates |
| `/app/documents` | Document Library | `app/app/documents/page.tsx` | Document repository, categories, versions |
| `/app/search` | Unified Search | `app/app/search/page.tsx` | Global search across tickets, units, assets, people |
| `/app/rules` | Rule Engine | `app/app/rules/page.tsx` | Business rule execution & automation triggers |
| `/app/workflows` | Workflow Orchestration | `app/app/workflows/page.tsx` | State machine definitions & execution instances |
| `/app/sla` | SLA Policies | `app/app/sla/page.tsx` | Priority response & resolution SLAs |

---

## 4. Property & Hierarchy Master
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/organizations` | Communities Master | `app/app/organizations/page.tsx` | Master list of townships & societies; `/app/communities` redirects here |
| `/app/communities/[id]` | Community 360 | `app/app/communities/[id]/page.tsx` | Community summary, sections, blocks |
| `/app/communities/[id]/towers/[towerId]` | Tower Detail | `app/app/communities/[id]/towers/[towerId]/page.tsx` | Tower floors, unit grid, floor plans |
| `/app/communities/[id]/units/[unitId]` | Unit 360 View | `app/app/communities/[id]/units/[unitId]/page.tsx` | Unit metadata, owner, tenant, ledger, tickets |

---

## 5. Residents, Households & Occupancy
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/communities/[id]/residents` | Residents Directory | `app/app/communities/[id]/residents/page.tsx` | Community-scoped resident roster, contact details, status; `/app/residents` redirects to organization selection |
| `/app/residents/[id]` | Resident 360 Profile | `app/app/residents/[id]/page.tsx` | Household members, ownerships, tenancies |
| `/app/organizations` | Households Management Entry | `app/app/organizations/page.tsx` | Organization/community selection entry; `/app/households` redirects here |
| `/app/resident/complaints` | Resident Complaints | `app/app/resident/complaints/page.tsx` | Self-service complaints queue |
| `/app/resident/complaints/new` | Submit Complaint | `app/app/resident/complaints/new/page.tsx` | Complaint submission form |
| `/app/resident/complaints/[id]` | Complaint Detail | `app/app/resident/complaints/[id]/page.tsx` | Complaint status, resolution feedback |

---

## 6. Helpdesk & Service Tickets
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/helpdesk` | Helpdesk Command Center | `app/app/helpdesk/page.tsx` | KPI cards, urgent tickets, SLA status |
| `/app/helpdesk/tickets` | Ticket Queue | `app/app/helpdesk/tickets/page.tsx` | Ticket list, filters, priority triage |
| `/app/helpdesk/tickets/[id]` | Ticket 360 Detail | `app/app/helpdesk/tickets/[id]/page.tsx` | Timeline, internal notes, work order dispatch |
| `/app/helpdesk/categories` | Ticket Categories | `app/app/helpdesk/categories/page.tsx` | Ticket categories, default assignment |
| `/app/helpdesk/teams` | Support Teams | `app/app/helpdesk/teams/page.tsx` | Specialist resolver teams |

---

## 7. Facility & Work Orders
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/facility` | Facility Operations | `app/app/facility/page.tsx` | Operations dashboard, PM status |
| `/app/facility/work-orders` | Work Orders Queue | `app/app/facility/work-orders/page.tsx` | Work order triage, assignment |
| `/app/facility/work-orders/[id]` | Work Order Detail | `app/app/facility/work-orders/[id]/page.tsx` | Checklists, parts consumed, technician sign-off |
| `/app/facility/maintenance-plans` | Preventive Maintenance | `app/app/facility/maintenance-plans/page.tsx` | Recurring PM schedules & triggers; `/app/facility/preventive` redirects here |
| `/app/facility/calendar` | Maintenance Calendar | `app/app/facility/calendar/page.tsx` | Operational schedules & crew view |

---

## 8. Physical Asset Management
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/assets` | Asset Master Registry | `app/app/assets/page.tsx` | Heavy machinery, elevators, DG, pumps |
| `/app/assets/[id]` | Asset 360 Lifecycle | `app/app/assets/[id]/page.tsx` | QR code, warranty, AMC, work orders |
| `/app/assets/categories` | Asset Categories | `app/app/assets/categories/page.tsx` | Equipment hierarchy categorization |
| `/app/assets/maintenance` | Maintenance Contracts | `app/app/assets/maintenance/page.tsx` | OEM AMCs, service SLAs |
| `/app/assets/downtime` | Downtime & Outage Logs | `app/app/assets/downtime/page.tsx` | Critical asset downtime tracking |

---

## 9. Inventory, Stores & Spares
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/inventory` | Inventory Dashboard | `app/app/inventory/page.tsx` | Reorder warnings, valuation |
| `/app/inventory/stores` | Stores & Bins | `app/app/inventory/stores/page.tsx` | Physical stock locations |
| `/app/inventory/balances` | Stock Balances | `app/app/inventory/balances/page.tsx` | On-hand quantity, available, reserved |
| `/app/inventory/receipts` | Stock Receipts (GRN) | `app/app/inventory/receipts/page.tsx` | Inward stock from POs |
| `/app/inventory/issues` | Stock Issues | `app/app/inventory/issues/page.tsx` | Material consumption to work orders |
| `/app/inventory/transfers` | Stock Transfers | `app/app/inventory/transfers/page.tsx` | Inter-store material movements |
| `/app/inventory/adjustments` | Stock Adjustments | `app/app/inventory/adjustments/page.tsx` | Cycle count variances & write-offs |
| `/app/inventory/scan` | Barcode/QR Scanner | `app/app/inventory/scan/page.tsx` | Mobile material scanner |
| `/app/inventory/import` | Stock CSV Import | `app/app/inventory/import/page.tsx` | Bulk inventory master import |

---

## 10. Vendor & Procurement Management
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/vendors` | Vendor Directory | `app/app/vendors/page.tsx` | Registered suppliers & contractors |
| `/app/vendors/[id]` | Vendor 360 Profile | `app/app/vendors/[id]/page.tsx` | Contracts, ratings, compliance |
| `/app/vendors/onboarding` | Vendor Onboarding | `app/app/vendors/onboarding/page.tsx` | Kyc, bank verification, approval |
| `/app/vendors/performance` | Vendor Performance | `app/app/vendors/performance/page.tsx` | Scorecards, delivery on-time rates |
| `/app/procurement` | Procurement Command | `app/app/procurement/page.tsx` | Spend analytics, pipeline |
| `/app/procurement/requisitions`| Purchase Requisitions | `app/app/procurement/requisitions/page.tsx` | Department PR creation & approval |
| `/app/procurement/rfqs` | RFQ Management | `app/app/procurement/rfqs/page.tsx` | Request for quotation tenders |
| `/app/procurement/quotations/compare`| Bid Comparison | `app/app/procurement/quotations/compare/page.tsx` | Multi-vendor quotation comparison |
| `/app/procurement/orders` | Purchase Orders (PO) | `app/app/procurement/orders/page.tsx` | PO issuance, approvals, lifecycle |
| `/app/procurement/receipts` | Goods Receipts (GRN) | `app/app/procurement/receipts/page.tsx` | Inward physical goods inspection |
| `/app/procurement/service-receipts`| Service Entry Sheets | `app/app/procurement/service-receipts/page.tsx` | Service delivery verification |

---

## 11. Financial Core ERP & Accounting
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/finance` | Financial Dashboard | `app/app/finance/page.tsx` | Cash flow, revenue, expense trends |
| `/app/finance/accounts` | Chart of Accounts | `app/app/finance/accounts/page.tsx` | Multi-level general ledger accounts |
| `/app/finance/journals` | Journal Vouchers | `app/app/finance/journals/page.tsx` | Double-entry balanced journal vouchers |
| `/app/finance/journals/[id]` | Journal Voucher Detail| `app/app/finance/journals/[id]/page.tsx` | Debits, credits, maker-checker signoff |
| `/app/finance/ledger` | General Ledger Inquiries| `app/app/finance/ledger/page.tsx` | Account ledger drilldowns |
| `/app/finance/trial-balance` | Trial Balance | `app/app/finance/trial-balance/page.tsx` | Verified balanced trial balance report |
| `/app/finance/periods` | Fiscal Periods | `app/app/finance/periods/page.tsx` | Fiscal year management, period closing |
| `/app/finance/opening-balances`| Opening Balances | `app/app/finance/opening-balances/page.tsx` | Year-beginning ledger balances |
| `/app/finance/integrity` | Financial Integrity | `app/app/finance/integrity/page.tsx` | Debit/Credit parity & audit verification |

---

## 12. Maintenance Billing & Accounts Receivable (AR)
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/billing` | Billing Operations | `app/app/billing/page.tsx` | Invoiced vs collected summary |
| `/app/billing/plans` | Tariff Plans | `app/app/billing/plans/page.tsx` | Rate formulas, sqft vs fixed charges |
| `/app/billing/runs` | Billing Runs | `app/app/billing/runs/page.tsx` | Automated batch monthly invoice generation |
| `/app/billing/invoices` | Invoices Directory | `app/app/billing/invoices/page.tsx` | Invoices queue, aging analysis |
| `/app/billing/invoices/[id]` | Invoice Detail | `app/app/billing/invoices/[id]/page.tsx` | Line item charges, PDF invoice export |
| `/app/billing/payments` | Payment Collections | `app/app/billing/payments/page.tsx` | UPI, NetBanking, Cheque receipts |
| `/app/billing/receipts` | Official Receipts | `app/app/billing/receipts/page.tsx` | Stamped payment acknowledgement receipts |
| `/app/billing/accounts` | Billable Accounts | `app/app/billing/accounts/page.tsx` | Unit ledger balances & advances |

---

## 13. Accounts Payable (AP) & Treasury
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/ap` | Accounts Payable Console| `app/app/ap/page.tsx` | Outstanding vendor obligations |
| `/app/ap/invoices` | Supplier Invoices | `app/app/ap/invoices/page.tsx` | Vendor billing, 3-way match verification |
| `/app/ap/aging` | AP Aging Report | `app/app/ap/aging/page.tsx` | 30/60/90 days payable buckets |
| `/app/ap/proposals` | Payment Proposals | `app/app/ap/proposals/page.tsx` | Batch payment approval queues |
| `/app/ap/runs` | Payment Runs | `app/app/ap/runs/page.tsx` | Automated bank payout executions |
| `/app/treasury` | Treasury Overview | `app/app/treasury/page.tsx` | Liquid bank balances, cash positions |
| `/app/treasury/accounts` | Bank Accounts | `app/app/treasury/accounts/page.tsx` | Operational & Sinking fund bank accounts |
| `/app/treasury/statements/import`| Import Bank Statement | `app/app/treasury/statements/import/page.tsx`| MT940/CSV statement parser |
| `/app/treasury/reconciliation`| Bank Reconciliation | `app/app/treasury/reconciliation/page.tsx`| Automated statement to ledger matching |

---

## 14. Budgeting & Capex Capital Projects
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/budgeting` | Budget Console | `app/app/budgeting/page.tsx` | Approved Annual Operating Plan (AOP); `/app/budget` redirects here |
| `/app/budget/plans` | Budget Versions | `app/app/budget/plans/page.tsx` | Draft, approved, amended budget versions |
| `/app/budget/lines` | Budget Line Items | `app/app/budget/lines/page.tsx` | Fund reservations & commitments |
| `/app/budget/variances` | Budget Variances | `app/app/budget/variances/page.tsx` | Actual vs forecast variance analytics |
| `/app/projects` | Capital Projects | `app/app/projects/page.tsx` | Capex initiatives overview |
| `/app/projects/list` | Projects Directory | `app/app/projects/list/page.tsx` | Active capital works portfolio |
| `/app/projects/[id]` | Project 360 & Gantt | `app/app/projects/[id]/page.tsx` | BOQ items, milestones, contractor link |
| `/app/projects/measurements`| Measurement Books | `app/app/projects/measurements/page.tsx`| Quantity surveyor on-site measurements |
| `/app/projects/certificates`| Payment Certificates | `app/app/projects/certificates/page.tsx`| Interim Payment Certificates (IPC) |
| `/app/projects/variations` | Change Orders | `app/app/projects/variations/page.tsx` | Scope variations & budget amendments |
| `/app/projects/snags` | Snagging Register | `app/app/projects/snags/page.tsx` | Construction defect punch lists |
| `/app/projects/handover` | Project Handover | `app/app/projects/handover/page.tsx` | Commissioning & asset master handoff |

---

## 15. Security, Gate & Visitor Management
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/security` | Security Command Center | `app/app/security/page.tsx` | Guard posts, active visitors, alerts |
| `/app/security/gate-app` | Guard Post Check-in App | `app/app/security/gate-app/page.tsx`| Fast barcode/phone entry verification |
| `/app/security/visitors` | Visitor Log | `app/app/security/visitors/page.tsx` | Pre-approved passes & visit history |
| `/app/security/active` | Active On-Premise | `app/app/security/active/page.tsx` | Currently checked-in guests & vehicles |
| `/app/security/deliveries` | Deliveries & Cabs | `app/app/security/deliveries/page.tsx` | Quick delivery passes (Amazon, Swiggy) |
| `/app/security/contractors`| Daily Staff Passes | `app/app/security/contractors/page.tsx`| Maids, drivers, maintenance contractors |
| `/app/security/watchlist` | Watchlist & Alerts | `app/app/security/watchlist/page.tsx` | Barred individuals & perimeter alerts |

---

## 16. Parking & Vehicle Management
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/parking` | Parking Console | `app/app/parking/page.tsx` | Total bays, occupancy percentage |
| `/app/parking/slots` | Parking Bays | `app/app/parking/slots/page.tsx` | Basements & surface bay inventory |
| `/app/parking/allocations` | Slot Allocations | `app/app/parking/allocations/page.tsx` | Unit-to-bay deed rights & assignments |
| `/app/parking/vehicles` | Vehicle Registry | `app/app/parking/vehicles/page.tsx` | Resident cars, two-wheelers, license plates |
| `/app/parking/permits` | FastTag / RFID Permits | `app/app/parking/permits/page.tsx`| Automated barrier gate RFID tags |
| `/app/parking/visitor-parking`| Visitor Parking Bays| `app/app/parking/visitor-parking/page.tsx`| Visitor vehicle slot tracking |
| `/app/parking/violations` | Parking Infractions | `app/app/parking/violations/page.tsx`| Unauthorized parking violations & fines |
| `/app/parking/ev` | EV Charging Bays | `app/app/parking/ev/page.tsx` | EV charging stations & power usage |

---

## 17. Amenities & Facility Bookings
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/amenities` | Amenities Directory | `app/app/amenities/page.tsx` | Clubhouse, pool, gym, banquet halls |
| `/app/amenities/[id]` | Amenity Profile | `app/app/amenities/[id]/page.tsx` | Slot definitions, capacity, hourly fees |
| `/app/amenities/bookings` | Bookings Calendar | `app/app/amenities/bookings/page.tsx` | Resident reservation calendar & passes |
| `/app/amenities/schedules` | Operating Schedules | `app/app/amenities/schedules/page.tsx`| Maintenance blackouts & opening hours |

---

## 18. Workforce & Staff Operations
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/workforce` | Workforce Console | `app/app/workforce/page.tsx` | Shift staffing, attendance compliance |
| `/app/workforce/workers` | Workers Directory | `app/app/workforce/workers/page.tsx` | Technicians, security guards, cleaners |
| `/app/workforce/roster` | Shift Rostering | `app/app/workforce/roster/page.tsx` | Shift allocation by department & week |
| `/app/workforce/attendance`| Biometric Attendance | `app/app/workforce/attendance/page.tsx`| Real-time punch records |
| `/app/workforce/skills` | Trade Licenses & Skills| `app/app/workforce/skills/page.tsx` | Certified electrician, plumber licenses |
| `/app/workforce/tasks` | Routine Checklists | `app/app/workforce/tasks/page.tsx` | Daily SOP checklists & guard patrols |
| `/app/workforce/deployments`| Post Deployments | `app/app/workforce/deployments/page.tsx`| Specific gate & plant room assignments |
| `/app/workforce/corrections`| Attendance Corrections| `app/app/workforce/corrections/page.tsx`| Missed punch regularization requests |

---

## 19. Society Governance & Meetings
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/governance` | Governance Overview | `app/app/governance/page.tsx` | Managing committee terms, active meetings |
| `/app/governance/committees`| Society Committees | `app/app/governance/committees/page.tsx`| Managing Committee, Subcommittees |
| `/app/governance/meetings` | Governance Meetings | `app/app/governance/meetings/page.tsx`| AGM, EGM, MCM schedules & quorum |
| `/app/governance/agendas` | Meeting Agendas | `app/app/governance/agendas/page.tsx` | Published agenda motions |
| `/app/governance/voting` | Electronic Voting | `app/app/governance/voting/page.tsx` | Quorum-validated secret ballot voting |
| `/app/governance/resolutions`| Committee Resolutions| `app/app/governance/resolutions/page.tsx`| Passed & ratified resolutions |
| `/app/governance/minutes` | Minutes of Meeting | `app/app/governance/minutes/page.tsx` | Certified recorded proceedings |
| `/app/governance/notices` | Statutory Notices | `app/app/governance/notices/page.tsx` | Formal society notices & circulars |
| `/app/governance/policies` | Society Bye-Laws | `app/app/governance/policies/page.tsx` | Rules & architectural regulations |

---

## 20. Utilities & Plant Operations
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/utilities` | Utilities Command | `app/app/utilities/page.tsx` | Power, water, DG fuel consumption |
| `/app/utilities/meters` | Meter Registry | `app/app/utilities/meters/page.tsx` | Electric, water, gas, solar meters |
| `/app/utilities/readings` | Meter Readings | `app/app/utilities/readings/page.tsx` | Telemetry logs & manual recordings |
| `/app/utilities/consumption`| Consumption Analytics | `app/app/utilities/consumption/page.tsx`| Daily & monthly consumption heatmaps |
| `/app/utilities/energy` | DG Genset Energy | `app/app/utilities/energy/page.tsx` | Fuel consumption & run hour logs |
| `/app/utilities/water` | Water & Tankers | `app/app/utilities/water/page.tsx` | Tanker receipts, water supply balance |
| `/app/utilities/tariffs` | Utility Tariffs | `app/app/utilities/tariffs/page.tsx` | Telescopic / slab-based utility tariffs |
| `/app/utilities/outages` | Outages & Shutdowns | `app/app/utilities/outages/page.tsx` | Planned power/water outages |
| `/app/utilities/billing-preview`| Utility Billing Run | `app/app/utilities/billing-preview/page.tsx`| Utility calculation handoff to AR |
| `/app/utilities/sustainability`| ESG & Sustainability | `app/app/utilities/sustainability/page.tsx`| Carbon offsets, solar green power |

---

## 21. Safety, Emergency & Compliance
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/safety` | Safety Command Center | `app/app/safety/page.tsx` | Compliance score, active hazard count |
| `/app/safety/sos` | Emergency SOS Dispatch | `app/app/safety/sos/page.tsx` | Panic button broadcast & responder units |
| `/app/safety/compliance` | Statutory Compliance | `app/app/safety/compliance/page.tsx` | Fire NOC, lift license, DG consent |
| `/app/safety/credentials`| Safety Credentials | `app/app/safety/credentials/page.tsx` | Certified safety auditor credentials |
| `/app/safety/inspections`| Safety Inspections | `app/app/safety/inspections/page.tsx` | Physical plant audit checklists |
| `/app/safety/hazards-risks`| Hazard Register | `app/app/safety/hazards-risks/page.tsx`| Risk severity scoring & remediation |
| `/app/safety/incidents` | Incidents & Near-Misses| `app/app/safety/incidents/page.tsx`| Accident reports & CAPA actions |
| `/app/safety/investigations`| Investigations | `app/app/safety/investigations/page.tsx`| Root cause analysis & witness statements |
| `/app/safety/drills` | Emergency Drills | `app/app/safety/drills/page.tsx` | Fire evacuation drill planning & timings |
| `/app/safety/evacuation` | Evacuation Zones | `app/app/safety/evacuation/page.tsx` | Muster points & floor warden rosters |

---

## 22. Analytics & Custom Reporting
| Route | Screen Name | Implemented File | Scope / Purpose |
|---|---|---|---|
| `/app/analytics` | Executive BI Analytics | `app/app/analytics/page.tsx` | Cross-domain high-level executive dashboard |
| `/app/analytics/reports` | Custom Report Builder | `app/app/analytics/reports/page.tsx` | Multi-table dataset query & export |
