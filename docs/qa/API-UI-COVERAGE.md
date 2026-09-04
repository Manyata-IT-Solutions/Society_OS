# Community OS — API & UI Coverage Matrix (Phase 25.5C)

This document maps all implemented frontend modules against the NestJS backend controllers and endpoints, categorizing integration status into:
- **INTEGRATED**: Real API called and consumed directly by frontend components.
- **BACKEND_ONLY**: Robust backend API exists, available for direct programmatic/API consumption or ready for future UX extension.
- **OPTIMISTIC_INTEGRATED**: Frontend state updates optimistically and synchronizes with API.
- **BROKEN**: API call failing due to parameter mismatch or payload issue (all remediated during Phase 25.5C).

---

## Domain Coverage Matrix

| Domain Module | Primary Backend Controller(s) | Frontend Route(s) | Status | Notes |
|---|---|---|---|---|
| **Authentication & IAM** | `auth.controller.ts`, `users.controller.ts`, `roles.controller.ts`, `sessions.controller.ts` | `/login`, `/app/users`, `/app/roles`, `/app/role-assignments`, `/app/sessions` | **INTEGRATED** | Silent token refresh, scoped permissions, session revocation. |
| **Organizations & Portfolios** | `organization.controller.ts`, `portfolios.controller.ts` | `/app/organizations`, `/app/portfolios` | **INTEGRATED** | Multi-tenant hierarchy; response normalization fixed. |
| **Property Master** | `buildings.controller.ts`, `floors.controller.ts`, `units.controller.ts`, `sections.controller.ts` | `/app/organizations`, `/app/communities/[id]/towers/[towerId]`, `/app/communities/[id]/units/[unitId]` | **INTEGRATED** | 504 units across 4 towers, floor plans, sqft metrics. `/app/communities` redirects to `/app/organizations`. |
| **Residents & Households** | `residents.controller.ts`, `households.controller.ts`, `occupancies.controller.ts`, `ownership.controller.ts` | `/app/communities/[id]/residents`, `/app/organizations`, `/app/resident/complaints` | **INTEGRATED** | 167 users, ownership and tenancies, move-in/out. `/app/residents` and `/app/households` redirect to `/app/organizations`. |
| **Helpdesk & Tickets** | `tickets.controller.ts`, `ticket-categories.controller.ts`, `ticket-teams.controller.ts` | `/app/helpdesk`, `/app/helpdesk/tickets`, `/app/helpdesk/tickets/[id]` | **INTEGRATED** | 325 tickets with SLA timers and work order escalation. |
| **Facility & Work Orders** | `work-order.controller.ts`, `pm-schedule.controller.ts` | `/app/facility`, `/app/facility/work-orders`, `/app/facility/calendar` | **INTEGRATED** | 234 work orders, maintenance checklists, technician assignments. |
| **Asset Management** | `asset.controller.ts`, `asset-meters.controller.ts`, `downtime.controller.ts` | `/app/assets`, `/app/assets/[id]`, `/app/assets/downtime` | **INTEGRATED** | 52 physical assets (Lifts, DG, Chillers) with warranties and AMCs. |
| **Inventory & Stores** | `inventory.controller.ts`, `stock-balance.controller.ts`, `goods-receipt.controller.ts`, `stock-issue.controller.ts` | `/app/inventory`, `/app/inventory/balances`, `/app/inventory/receipts`, `/app/inventory/issues` | **INTEGRATED** | Bin locations, stock ledger, work order consumption. |
| **Vendor Management** | `vendor.controller.ts`, `vendor-scorecard.controller.ts` | `/app/vendors`, `/app/vendors/[id]`, `/app/vendors/onboarding` | **INTEGRATED** | Vendor registry, compliance verification, contracts. |
| **Procurement & SCM** | `purchase-requisition.controller.ts`, `rfq.controller.ts`, `purchase-order.controller.ts`, `goods-receipt-note.controller.ts` | `/app/procurement`, `/app/procurement/requisitions`, `/app/procurement/orders`, `/app/procurement/receipts` | **INTEGRATED** | PR $\to$ RFQ $\to$ PO $\to$ GRN $\to$ Invoice 3-way matching. |
| **Finance Core ERP** | `accounts.controller.ts`, `journals.controller.ts`, `general-ledger.controller.ts`, `trial-balance.controller.ts` | `/app/finance`, `/app/finance/accounts`, `/app/finance/journals`, `/app/finance/trial-balance` | **INTEGRATED** | Double-entry journal vouchers, multi-tier COA, period close. |
| **Maintenance Billing & AR**| `billing-run.controller.ts`, `invoices.controller.ts`, `payments.controller.ts`, `receipts.controller.ts` | `/app/billing`, `/app/billing/invoices`, `/app/billing/payments`, `/app/billing/receipts` | **INTEGRATED** | 2,028 invoices, batch billing runs, UPI allocations. |
| **Accounts Payable** | `supplier-invoice.controller.ts`, `ap-aging.controller.ts`, `payment-run.controller.ts` | `/app/ap`, `/app/ap/invoices`, `/app/ap/aging`, `/app/ap/runs` | **INTEGRATED** | Vendor bills, 30/60/90 aging, batch payment proposals. |
| **Treasury & Banking** | `bank-account.controller.ts`, `bank-statement.controller.ts`, `bank-reconciliation.controller.ts` | `/app/treasury`, `/app/treasury/accounts`, `/app/treasury/reconciliation` | **INTEGRATED** | Bank accounts, statement imports, rule-based matching. |
| **Budgeting & Control** | `budget.controller.ts`, `budget-version.controller.ts`, `budget-variance.controller.ts` | `/app/budgeting` | **INTEGRATED** | AOP, commitments vs actuals, variance tracking. `/app/budget` redirects to `/app/budgeting`. |
| **Capital Projects (Capex)**| `project.controller.ts`, `boq.controller.ts`, `measurement.controller.ts`, `certification.controller.ts` | `/app/projects`, `/app/projects/list`, `/app/projects/[id]`, `/app/projects/certificates` | **INTEGRATED** | Capex work packages, contractor certifications, snags. |
| **Security & Gate Access** | `gate.controller.ts`, `visitor.controller.ts`, `contractor-access.controller.ts`, `watchlist.controller.ts` | `/app/security`, `/app/security/gate-app`, `/app/security/visitors`, `/app/security/active` | **INTEGRATED** | 168 visitor passes, fast QR gate check-in, active on-premise. |
| **Parking & Vehicles** | `parking-inventory.controller.ts`, `vehicle.controller.ts`, `parking-allocation.controller.ts`, `ev-charging.controller.ts` | `/app/parking`, `/app/parking/slots`, `/app/parking/vehicles`, `/app/parking/allocations` | **INTEGRATED** | Bay rights, vehicle registry, RFID barrier tags, EV bays. |
| **Amenities & Clubhouse** | `amenity.controller.ts`, `amenity-booking.controller.ts` | `/app/amenities`, `/app/amenities/[id]`, `/app/amenities/bookings` | **INTEGRATED** | 14 amenities, slot scheduling, paid bookings, guest access. |
| **Workforce & Staff** | `workers.controller.ts`, `rosters.controller.ts`, `attendance.controller.ts`, `structure.controller.ts` | `/app/workforce`, `/app/workforce/workers`, `/app/workforce/roster`, `/app/workforce/skills` | **INTEGRATED** | Staff directory, shift rosters, trade licenses, daily SOPs. |
| **Governance & AGM** | `governance-committee.controller.ts`, `governance-meeting.controller.ts`, `governance-notice.controller.ts` | `/app/governance`, `/app/governance/committees`, `/app/governance/meetings`, `/app/governance/voting` | **INTEGRATED** | Managing committees, EGM/AGM meetings, secret ballot voting. |
| **Utilities & Meters** | `meters.controller.ts`, `readings.controller.ts`, `tariffs.controller.ts`, `energy.controller.ts`, `water.controller.ts` | `/app/utilities`, `/app/utilities/meters`, `/app/utilities/readings`, `/app/utilities/energy` | **INTEGRATED** | 10 meters, 1,160 readings, DG run logs, tanker deliveries. |
| **Safety, SOS & Compliance**| `sos.controller.ts`, `compliance.controller.ts`, `incidents.controller.ts`, `drills.controller.ts`, `evacuation.controller.ts`| `/app/safety`, `/app/safety/sos`, `/app/safety/compliance`, `/app/safety/incidents` | **INTEGRATED** | SOS panic console, Fire NOCs, incident CAPA, muster points. |
| **Analytics & BI** | `analytics-dashboard.controller.ts`, `custom-report.controller.ts` | `/app/analytics`, `/app/analytics/reports` | **INTEGRATED** | Multi-table analytical reporting, executive KPI cards. |
| **Search Engine** | `search.controller.ts` | `/app/search` | **INTEGRATED** | Cross-domain indexed search across all operational records. |
| **Workflow Engine** | `workflow.controller.ts` | `/app/workflows` | **INTEGRATED** | State machines, transition history, maker-checker steps. |
