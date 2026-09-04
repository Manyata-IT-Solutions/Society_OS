# Community OS — Executive Demo Walkthrough Script (20–30 Minutes)

This operational guide provides step-by-step instructions to demonstrate end-to-end enterprise capabilities using real, coherent records already seeded in the database.

## Phase 25.5F-C Validation Note

Status: PASS as of 2026-09-04.

The walkthrough has been reconciled with the current idempotent full-demo seed. The repeatable verifier `pnpm --filter @community-os/database demo:verify` validates all five executive stories against actual database effects: ticket/work-order linkage, lift downtime/service closure, procurement/AP payment, resident AR payment, and water-quality incident CAPA closure.

---

## Demo Credentials & Access

| Portal | URL | Demo Account | Password | Role |
|---|---|---|---|---|
| **Admin Console** | `http://localhost:3000/login` | `admin@communityos.io` | `Admin@CommunityOS2026!` | Super Admin |
| **Estate Management** | `http://localhost:3000/login` | `manager.gvh@northstar.demo` | `Admin@CommunityOS2026!` | Community General Manager |
| **Finance Office** | `http://localhost:3000/login` | `accountant.gvh@northstar.demo` | `Admin@CommunityOS2026!` | Senior Accountant |
| **Gate Security** | `http://localhost:3000/login` | `guard.north@northstar.demo` | `Admin@CommunityOS2026!` | Gate Security Guard |
| **Resident Portal** | `http://localhost:3000/login` | `resident.a-301@demo.local` | `Admin@CommunityOS2026!` | Resident Owner (A-301) |

---

## Executive Demo Story A: Resident Complaint to Resolution (A-301 Water Leak)
**Target Time**: 5–6 Minutes  
**Domains Covered**: Resident Portal $\to$ Helpdesk $\to$ Facility $\to$ Workforce $\to$ Inventory

### Step-by-Step Script:
1. **Login as Resident Owner**:
   * Navigate to `http://localhost:3000/login`, sign in with `resident.a-301@demo.local`.
   * Open **[Resident Complaints](http://localhost:3000/app/resident/complaints)**.
   * Highlight complaint for **Unit A-301**: `TKT-2026-3012`, *"Water seepage in master bathroom ceiling"* (Priority: `HIGH`, Category: `PLUMBING`).
2. **Helpdesk Triage & SLA Tracking**:
   * Switch to Helpdesk Lead session (`helpdesk.gvh@northstar.demo`).
   * Navigate to **[Helpdesk Tickets Queue](http://localhost:3000/app/helpdesk/tickets)**.
   * View Ticket `TKT-2026-3012`. Show the resolved triage outcome and automated work-order linkage.
3. **Work Order Generation & Technician Dispatch**:
   * Open the linked Work Order `WO-2026-3012`.
   * Open **[Work Orders](http://localhost:3000/app/facility/work-orders)**.
   * Show assigned plumbing technician and completed verification.
4. **Material Consumption & Resolution**:
   * In the Work Order task checklist, inspect the four completed steps: inspect seepage source, reseal plumbing joint, pressure-test bathroom line, and resident handover.
   * Inspect the linked material requirement for the plumbing repair.
   * Confirm Work Order status `COMPLETED`, Ticket status `RESOLVED`, and 5-star resident feedback.

---

## Executive Demo Story B: Heavy Equipment Asset Breakdown (Tower A Elevator)
**Target Time**: 5 Minutes  
**Domains Covered**: Physical Assets $\to$ Maintenance Outages $\to$ Procurement/OEM AMC $\to$ Resolution

### Step-by-Step Script:
1. **Asset Master Inspection**:
   * Login as Facility Manager (`facility.gvh@northstar.demo`).
   * Navigate to **[Asset Master](http://localhost:3000/app/assets)**.
   * Open Asset `AST-2026-000004`: **Tower A Passenger Elevator (Lift-1)**.
   * Show current status `OPERATIONAL` after corrective repair.
2. **Log Asset Downtime**:
   * Open **[Downtime Tracking](http://localhost:3000/app/assets/downtime)**.
   * Show recorded downtime event: *"Drive inverter over-temperature trip"* with 175 minutes total downtime.
3. **Emergency Outage Broadcast**:
   * Open **[Outages & Restorations](http://localhost:3000/app/utilities/outages)**.
   * Point out the operational note that Lift-2 remained available while Lift-1 was repaired.
4. **OEM Service Closure & MTTR Calculation**:
   * Show technician field intervention log $\to$ Work Order `WO-DEMO-LIFT-01` completed.
   * Asset status updates to `OPERATIONAL`.
   * Downtime closed and corrective service record captured for asset analytics.

---

## Executive Demo Story C: SCM & Inventory Replenishment (Safety Spares)
**Target Time**: 5–6 Minutes  
**Domains Covered**: Inventory $\to$ Requisitions (PR) $\to$ RFQs $\to$ Purchase Orders (PO) $\to$ GRN $\to$ AP

### Step-by-Step Script:
1. **Low Stock Reorder Trigger**:
   * Login as Storekeeper (`store.manager@northstar.demo`).
   * Navigate to **[Stock Balances](http://localhost:3000/app/inventory/balances)**.
   * Filter for safety/facility spares included in the current demo procurement chain.
2. **Purchase Requisition (PR) to RFQ**:
   * Open **[Purchase Requisitions](http://localhost:3000/app/procurement/requisitions)**. Show approved PR `PR-2026-000001`.
   * Open **[RFQ Management](http://localhost:3000/app/procurement/rfqs)**.
   * Click **[Bid Comparison](http://localhost:3000/app/procurement/quotations/compare)** and show the awarded quote flow.
3. **PO Issuance & Goods Receipt Note (GRN)**:
   * Show awarded Purchase Order `PO-2026-000001`.
   * Open **[Goods Receipts (GRN)](http://localhost:3000/app/procurement/receipts)** $\to$ GRN `GRN-2026-000001`.
   * Verify accepted goods receipt and linked inventory movement.
4. **Three-Way Matching & AP Vendor Ledger**:
   * Open **[Supplier Invoices](http://localhost:3000/app/ap/invoices)**.
   * Verify that PO `PO-2026-000001`, GRN `GRN-2026-000001`, and Supplier Invoice `APINV-2026-000001` match.
   * Confirm AP payment allocation exists and the supplier invoice is `PAID`.

---

## Executive Demo Story D: Resident Maintenance Billing & Payment Reconciliation
**Target Time**: 5 Minutes  
**Domains Covered**: Billing Runs $\to$ Invoices $\to$ Payment Collections $\to$ Official Receipts $\to$ AR & General Ledger

### Step-by-Step Script:
1. **Automated Monthly Billing Run**:
   * Login as Senior Accountant (`accountant.gvh@northstar.demo`).
   * Navigate to **[Billing Runs](http://localhost:3000/app/billing/runs)**.
   * Point out the April 2026 Maintenance Run: 144 residential units billed based on super-built-up area (₹3.50/sqft + fixed sinking fund).
2. **Resident Invoice & Unit Ledger**:
   * Open **[Invoices](http://localhost:3000/app/billing/invoices)** $\to$ inspect Invoice `#INV-2026-000101` for Unit `A-101`.
   * Subtotal: ₹3,800. Status: `PAID`.
3. **Payment Collection & Allocation**:
   * Open **[Payments](http://localhost:3000/app/billing/payments)** $\to$ Payment `#PAY-2026-000101` received via UPI.
   * Show that 100% of the ₹3,800 was allocated against the invoice, clearing the unit's outstanding balance.
4. **Official Stamped Receipt & GL Posting**:
   * Open **[Receipts](http://localhost:3000/app/billing/receipts)** $\to$ show generated Receipt `#RCT-2026-000101`.
   * Open **[Chart of Accounts](http://localhost:3000/app/finance/accounts)** $\to$ verify automated debit to `Bank Account - ICICI Ops (1110)` and credit to `Maintenance Fee Income (4110)`.

---

## Executive Demo Story E: Potable Water Supply & Tanker Inward Quality Incident
**Target Time**: 5 Minutes  
**Domains Covered**: Utilities $\to$ Water Delivery $\to$ Safety Incident $\to$ CAPA $\to$ Resolution

### Step-by-Step Script:
1. **Water Tanker Receipt Logging**:
   * Login as Facility Manager (`facility.gvh@northstar.demo`).
   * Navigate to **[Water & Tankers](http://localhost:3000/app/utilities/water)**.
   * Inspect logged delivery: `Water Tanker WT-42 (12,000 Liters) from Cauvery Water Carriers`.
2. **Quality Sensor / TDS Deviation**:
   * Water testing indicates elevated Total Dissolved Solids (TDS > 750 ppm).
   * Storage inlet valve diverted to flushing reservoir.
3. **Safety Incident Command & CAPA**:
   * Open **[Incidents & Near-Misses](http://localhost:3000/app/safety/incidents)**.
   * Incident logged: `INC-DEMO-WATER-QUALITY-01: Tanker Water TDS Deviation Alert`.
   * Immediate CAPA action assigned: Tanker supplier quarantined; secondary filtration bed backwashed.
4. **Laboratory Retest & Closure**:
   * Secondary test passes (TDS 184 ppm).
   * Safety Officer signs off $\to$ Incident closed.
   * Quality report published to Estate Management dashboard.
