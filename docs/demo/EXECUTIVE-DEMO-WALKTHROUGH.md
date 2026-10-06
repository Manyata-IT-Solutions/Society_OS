# Community OS — Executive Demo Walkthrough Script (20–30 Minutes)

This operational guide provides step-by-step instructions to demonstrate end-to-end enterprise capabilities using real, coherent records already seeded in the database.

## Phase 25.5F-B Validation Note

Status: FAIL/PARTIAL as of 2026-09-03.

Repository evidence shows that this script needs reconciliation with current demo seed data before RC freeze. Related demo records exist, but the exact scripted anchors were not fully proven: Unit `A-405` was not found in the current `units` table, `ticket_work_order_links` is empty, and the Tower A lift downtime chain was not proven from current data. Do not present these five stories as RC-validated until the seed/script mismatch is corrected and the walkthrough is rerun end-to-end.

---

## Demo Credentials & Access

| Portal | URL | Demo Account | Password | Role |
|---|---|---|---|---|
| **Admin Console** | `http://localhost:3000/login` | `admin@communityos.io` | `Admin@CommunityOS2026!` | Super Admin |
| **Estate Management** | `http://localhost:3000/login` | `manager.gvh@northstar.demo` | `Admin@CommunityOS2026!` | Community General Manager |
| **Finance Office** | `http://localhost:3000/login` | `accountant.gvh@northstar.demo` | `Admin@CommunityOS2026!` | Senior Accountant |
| **Gate Security** | `http://localhost:3000/login` | `guard.north@northstar.demo` | `Admin@CommunityOS2026!` | Gate Security Guard |
| **Resident Portal** | `http://localhost:3000/login` | `resident.owner@demo.local` | `Admin@CommunityOS2026!` | Resident Owner (A-405) |

---

## Executive Demo Story A: Resident Complaint to Resolution (A-405 Water Leak)
**Target Time**: 5–6 Minutes  
**Domains Covered**: Resident Portal $\to$ Helpdesk $\to$ Facility $\to$ Workforce $\to$ Inventory

### Step-by-Step Script:
1. **Login as Resident Owner**:
   * Navigate to `http://localhost:3000/login`, sign in with `resident.owner@demo.local`.
   * Open **[Resident Complaints](http://localhost:3000/app/resident/complaints)**.
   * Highlight complaint for **Unit A-405**: *"Water seepage in master bathroom ceiling"* (Priority: `HIGH`, Category: `PLUMBING`).
2. **Helpdesk Triage & SLA Tracking**:
   * Switch to Helpdesk Lead session (`helpdesk.gvh@northstar.demo`).
   * Navigate to **[Helpdesk Tickets Queue](http://localhost:3000/app/helpdesk/tickets)**.
   * View Ticket `#TKT-2026-00001`. Show the live SLA countdown timer and automated team routing (`Facility Plumbing Team`).
3. **Work Order Generation & Technician Dispatch**:
   * Click **Generate Work Order** $\to$ generates Work Order `#WO-2026-00001`.
   * Open **[Work Orders](http://localhost:3000/app/facility/work-orders)**.
   * Show assigned technician: `Manoj Yadav (Senior Plumber)`.
4. **Material Consumption & Resolution**:
   * In the Work Order task checklist, inspect the consumed inventory item: `PVC Pipe Sealant 250ml` and `CPVC Coupling 1/2"`.
   * Mark tasks complete $\to$ Technician signs off.
   * Status transitions to `RESOLVED`.
   * Return to Resident view: Resident receives in-app resolution notification and provides 5-star CSAT feedback.

---

## Executive Demo Story B: Heavy Equipment Asset Breakdown (Tower A Elevator)
**Target Time**: 5 Minutes  
**Domains Covered**: Physical Assets $\to$ Maintenance Outages $\to$ Procurement/OEM AMC $\to$ Resolution

### Step-by-Step Script:
1. **Asset Master Inspection**:
   * Login as Facility Manager (`facility.gvh@northstar.demo`).
   * Navigate to **[Asset Master](http://localhost:3000/app/assets)**.
   * Open Asset `AST-LIFT-01`: **Tower A Passenger Elevator (Lift-1)** (Schindler 13-Pax, 1.75 m/s).
   * Show linked OEM AMC Contract: `Elevate Lift Solutions India Pvt Ltd` (24x7 Breakdown Response).
2. **Log Asset Downtime**:
   * Open **[Downtime Tracking](http://localhost:3000/app/assets/downtime)**.
   * Show recorded downtime event: *"Drive inverter over-temperature trip"* (Status: `ACTIVE_OUTAGE`).
3. **Emergency Outage Broadcast**:
   * Open **[Outages & Restorations](http://localhost:3000/app/utilities/outages)**.
   * Point out the scheduled broadcast notice to Tower A residents informing them that Lift-2 remains operational.
4. **OEM Service Closure & MTTR Calculation**:
   * Show technician field intervention log $\to$ Work Order `#WO-LIFT-04` completed.
   * Asset status updates to `OPERATIONAL`.
   * Downtime closed $\to$ Mean Time to Repair (MTTR) automatically logged in Analytics.

---

## Executive Demo Story C: SCM & Inventory Replenishment (Safety Spares)
**Target Time**: 5–6 Minutes  
**Domains Covered**: Inventory $\to$ Requisitions (PR) $\to$ RFQs $\to$ Purchase Orders (PO) $\to$ GRN $\to$ AP

### Step-by-Step Script:
1. **Low Stock Reorder Trigger**:
   * Login as Storekeeper (`store.manager@northstar.demo`).
   * Navigate to **[Stock Balances](http://localhost:3000/app/inventory/balances)**.
   * Filter for safety items $\to$ Show `Fire Extinguisher ABC Powder 6KG` near reorder threshold.
2. **Purchase Requisition (PR) to RFQ**:
   * Open **[Purchase Requisitions](http://localhost:3000/app/procurement/requisitions)**. Show approved PR `#PR-2026-00012`.
   * Open **[RFQ Management](http://localhost:3000/app/procurement/rfqs)**.
   * Click **[Bid Comparison](http://localhost:3000/app/procurement/quotations/compare)**: Compare quotes from `Ceasefire Safety Systems` vs `SafeGuard Solutions`.
3. **PO Issuance & Goods Receipt Note (GRN)**:
   * Show awarded Purchase Order `#PO-2026-00015`.
   * Open **[Goods Receipts (GRN)](http://localhost:3000/app/procurement/receipts)** $\to$ GRN `#GRN-2026-00015`.
   * Verify inward physical inspection: 25 units accepted into Main Central Store (Bin `SEC-FIRE-01`).
4. **Three-Way Matching & AP Vendor Ledger**:
   * Open **[Supplier Invoices](http://localhost:3000/app/ap/invoices)**.
   * Verify that PO `#PO-2026-00015`, GRN `#GRN-2026-00015`, and Vendor Invoice match with zero variance.
   * Approved invoice moves into Accounts Payable Aging.

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
   * Incident logged: `INC-2026-00004: Tanker Water TDS Deviation Alert`.
   * Immediate CAPA action assigned: Tanker supplier quarantined; secondary filtration bed backwashed.
4. **Laboratory Retest & Closure**:
   * Secondary test passes (TDS 180 ppm, Chlorine 0.5 ppm).
   * Safety Officer signs off $\to$ Incident closed.
   * Quality report published to Estate Management dashboard.
