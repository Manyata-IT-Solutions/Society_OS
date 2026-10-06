# Community OS — End-to-End Business Validation Register (Phase 25.5D)

This document details the cross-domain transactional execution, role handoffs, state machine transitions, event propagations, financial impacts, and reconciliation status across all operational domains.

---

## Scenario Summary & Results

### SCENARIO 01: Resident Service Request to Technician Completion & CSAT (FLOW 1)
- **Goal**: Full lifecycle of a residential maintenance complaint from filing to sign-off and feedback.
- **Actors**: Resident Owner (`resident.owner@demo.local`), Helpdesk Lead (`helpdesk.gvh@northstar.demo`), Plumber (`tech.plumb@northstar.demo`).
- **Start State**: Unit A-405 reports water leakage.
- **Execution Steps**:
  1. Resident submits complaint via `/app/resident/complaints/new` (Subject: *"Water seepage in master bathroom ceiling"*).
  2. Helpdesk triages ticket `#TKT-2026-00001` $\to$ Priority `HIGH`, Category `PLUMBING`, SLA target: 4h response / 24h resolution.
  3. Work Order `#WO-2026-00001` generated and assigned to Lead Plumber Manoj Yadav.
  4. Plumber consumes 1x `PVC Sealant 250ml` and 2x `CPVC Coupling 1/2"` from Central Store.
  5. Work completed $\to$ Work order evidence photo uploaded $\to$ Work order signed off.
  6. Ticket state transitions to `RESOLVED`.
  7. Resident submits CSAT Rating: 5/5 Stars.
- **Cross-Domain Effects**:
  - *Inventory*: Stock balances decremented by consumed quantities; stock ledger entry created.
  - *Notifications*: In-app dispatch notification to technician; resolution notice to resident.
  - *Audit*: Actor ID, timestamp, and status transition logged in immutable audit trail.
  - *Analytics*: Helpdesk SLA resolved within target; MTTR updated.
- **Result**: **PASS**

---

### SCENARIO 02: Critical Asset Outage & Preventive Maintenance (FLOW 2 & 3)
- **Goal**: Heavy elevator breakdown handling, resident outage notification, OEM vendor dispatch, and PM reset.
- **Actors**: Facility Manager (`facility.gvh@northstar.demo`), OEM Technician (`tech.electric@northstar.demo`).
- **Start State**: Asset `AST-LIFT-01` (Tower A Passenger Elevator) triggers inverter over-temperature alert.
- **Execution Steps**:
  1. Facility manager logs downtime incident in `/app/assets/downtime`.
  2. Outage broadcast published to Tower A residents: *"Lift 1 under emergency maintenance; Lift 2 operational"*.
  3. Work order `#WO-LIFT-04` dispatched to Schindler AMC provider `Elevate Lift Solutions`.
  4. OEM technician replaces thermal sensor $\to$ Work order closed.
  5. Asset status restored to `OPERATIONAL`.
  6. Preventive maintenance calendar updates next inspection date (+30 days).
- **Cross-Domain Effects**:
  - *Assets*: Asset downtime duration computed (1.4 hours); MTBF updated.
  - *Utilities/Outages*: Outage record marked `RESOLVED`.
  - *Analytics*: Facility uptime reflects 99.8% availability.
- **Result**: **PASS**

---

### SCENARIO 03: Inventory Reorder & Procurement to AP Three-Way Match (FLOW 4 & 5)
- **Goal**: Autonomous stock reorder trigger, quotation evaluation, PO issuance, inward GRN, and supplier invoice approval.
- **Actors**: Storekeeper (`store.manager@northstar.demo`), Procurement Lead (`procurement@northstar.demo`), Accountant (`accountant.gvh@northstar.demo`).
- **Start State**: Central store fire safety stock below minimum reorder level (5 units remaining; reorder point: 10).
- **Execution Steps**:
  1. Purchase Requisition `#PR-2026-00012` generated for 25x `Fire Extinguisher ABC Powder 6KG`.
  2. Department head approves PR within AOP safety budget allocation.
  3. RFQ issued $\to$ 2 vendor bids received and compared via `/app/procurement/quotations/compare`.
  4. Award granted to `Ceasefire Safety Systems` (Lowest compliant bid @ ₹2,200/unit).
  5. Purchase Order `#PO-2026-00015` released (Total: ₹55,000 + GST).
  6. Goods arrive at Security Gate 1 $\to$ GRN `#GRN-2026-00015` recorded with QA inspection pass.
  7. Inventory item balance incremented from 5 to 30 units in Central Store (Bin `SEC-FIRE-01`).
  8. Supplier invoice `#INV-CF-8821` submitted for ₹64,900 (inclusive of 18% GST).
  9. Three-Way Matching Engine validates PO = GRN = Invoice quantity and price $\to$ Zero variance.
  10. Invoice approved and posted to Accounts Payable ledger.
- **Cross-Domain Effects**:
  - *Inventory*: 25 units added to stock balance; stock ledger reflects `RECEIPT_PO`.
  - *Procurement*: PO status set to `FULFILLED`.
  - *Finance/AP*: Debit `Safety Equipment Expense (5240)` ₹55,000, Debit `Input GST (1320)` ₹9,900, Credit `Accounts Payable (2110)` ₹64,900.
  - *Budget*: PR reservation converted to actual expenditure.
- **Result**: **PASS**

---

### SCENARIO 04: Monthly Maintenance Billing Run & UPI Payment Allocation (FLOW 7 & 8)
- **Goal**: High-volume batch billing generation, unit billable account debits, resident online payment, and ledger reconciliation.
- **Actors**: Senior Accountant (`accountant.gvh@northstar.demo`), Resident (`resident.owner@demo.local`).
- **Start State**: Billing period `BP_2026_04` initiated for Green Valley Heights.
- **Execution Steps**:
  1. Billing Run executed across 144 residential units based on super-built-up area formula.
  2. 144 Invoices generated with sequential numbering (`INV-2026-000101` to `INV-2026-000244`).
  3. Invoice `#INV-2026-000101` generated for Unit `A-101`: ₹3,800 (Due Date: 15th April).
  4. Resident logs into portal $\to$ reviews line item breakdown.
  5. Resident initiates exact payment of ₹3,800 via UPI gateway simulator.
  6. Webhook verifies transaction `#PAY-2026-000101` $\to$ status `SUCCESS`.
  7. Automated receipt allocation clears outstanding balance to ₹0.00.
  8. Official Stamped Receipt `#RCT-2026-000101` generated and emailed to resident.
- **Cross-Domain Effects**:
  - *Billing*: Invoice status updated from `UNPAID` to `PAID`.
  - *Resident Ledger*: Debit ₹3,800 (Invoice), Credit ₹3,800 (Payment) $\to$ Net Balance ₹0.00.
  - *Finance Core GL*: Debit `Bank Account ICICI (1110)` ₹3,800, Credit `Maintenance Income (4110)` ₹3,800.
  - *Notifications*: Payment receipt confirmation delivered via in-app alert.
- **Result**: **PASS**

---

### SCENARIO 05: Gate Security Visitor Access & Parking Allocation (FLOW 18 & 20)
- **Goal**: Resident digital guest invite, QR scan at barrier gate post, parking bay assignment, and exit logging.
- **Actors**: Resident (`resident.owner@demo.local`), Gate Security Guard (`guard.north@northstar.demo`).
- **Start State**: Guest arriving for Unit A-405 in vehicle `KA-01-MJ-4921`.
- **Execution Steps**:
  1. Resident generates digital guest pass `#INV-2026-000001` with entry window.
  2. Guest presents QR code at North Security Gate.
  3. Guard scans code via Guard Post Console (`/app/security/gate-app`).
  4. Gate system validates pass $\to$ Green barrier light activates.
  5. Security console allocates temporary Visitor Parking Stall `V-BAY-12`.
  6. Pass state transitions to `ACTIVE_ON_PREMISE`.
  7. Guest departs $\to$ Guard logs exit at South Gate.
  8. Pass state transitions to `COMPLETED`; Stall `V-BAY-12` released back to available inventory.
- **Cross-Domain Effects**:
  - *Security*: Active visitor count correctly increments and decrements in real-time.
  - *Parking*: Visitor bay occupancy dynamically updates.
  - *Concurrency*: Repeated presentation of the same one-time QR pass rejected with `PASS_ALREADY_USED`.
  - *Audit*: Inward and outward vehicle timestamps captured.
- **Result**: **PASS**

---

### SCENARIO 06: Annual General Meeting (AGM) Digital Quorum & Voting (FLOW 29)
- **Goal**: Statutory general body meeting, electronic quorum verification, secret ballot voting on capital expenditure, and resolution certification.
- **Actors**: Managing Committee Secretary (`secretary.rwa@demo.local`), Resident Members.
- **Start State**: AGM 2026 scheduled to vote on Solar Rooftop Capex Project.
- **Execution Steps**:
  1. 21-day statutory meeting notice `#NOT-2026-01` published to all eligible resident owners.
  2. Electronic meeting room opens $\to$ Quorum verified (78 out of 105 voting members present; quorum requirement: 51%).
  3. Motion tabled: *"Approval of ₹12.5L Capex for 50kW Grid-Tied Solar Plant"*.
  4. Secret ballot voting window opened for 30 minutes.
  5. 72 votes cast: 65 For, 5 Against, 2 Abstained.
  6. Motion declared passed $\to$ Formal Resolution `#RES-2026-04` ratified and recorded in Meeting Minutes.
  7. Capex Project workflow automatically initialized.
- **Cross-Domain Effects**:
  - *Governance*: Resolution recorded with immutable cryptographic vote tally snapshot.
  - *Projects*: Linked capital project initialized with approved resolution reference.
  - *Communications*: Certified Minutes of Meeting published to Document Library.
- **Result**: **PASS**

---

### SCENARIO 07: Water Meter Telemetry to Utility Charge Calculation (FLOW 32)
- **Goal**: Sub-meter reading ingestion, telescopic tariff slab calculation, and handoff to resident billing ledger.
- **Actors**: Technical Staff (`tech.electric@northstar.demo`), Billing Engine.
- **Start State**: Unit A-102 water meter `MTR-WTR-A102` logs month-end reading.
- **Execution Steps**:
  1. Meter reading of 1,480 kL recorded (Previous reading: 1,455 kL $\to$ Consumption: 25 kL).
  2. Utility Tariff Engine evaluates tiered slab:
     - Slab 1 (0–15 kL): 15 kL @ ₹15/kL = ₹225
     - Slab 2 (16–25 kL): 10 kL @ ₹28/kL = ₹280
     - Total Utility Charge: ₹505.
  3. Utility charge record created and linked to unit billable account.
  4. Charge automatically incorporated into next monthly maintenance billing statement.
- **Cross-Domain Effects**:
  - *Utilities*: Consumption telemetry archived in historical trend repository.
  - *Billing*: Utility sub-charge appended to draft billing run liability lines.
  - *Analytics*: Township daily water consumption graph updated.
- **Result**: **PASS**

---

### SCENARIO 08: Emergency SOS Panic Dispatch & Incident Resolution (FLOW 38 & 11)
- **Goal**: Resident panic button activation, security guard quick-reaction team (QRT) dispatch, incident timeline logging, and CAPA remediation.
- **Actors**: Resident (`resident.tenant@demo.local`), Security Lead (`security.lead@northstar.demo`).
- **Start State**: Lift emergency intercom button triggered in Tower B.
- **Execution Steps**:
  1. Lift intercom alert triggers audio alarm on Security Dispatch Console (`/app/safety/sos`).
  2. Security operator acknowledges alert within 18 seconds.
  3. Quick Reaction Team (Guard Dharmendra Singh) dispatched to Tower B Ground Floor.
  4. Guard arrives on scene $\to$ communicates with passenger via car intercom $\to$ manual door release engaged.
  5. Passenger evacuated safely within 6 minutes.
  6. Safety incident `#INC-2026-00003` logged with complete chronological timeline.
  7. Corrective Action Plan (CAPA) assigned to Schindler lift technician for door sensor realignment.
  8. Post-incident review completed and certified by Safety Officer.
- **Cross-Domain Effects**:
  - *Safety/Incident*: Full timeline recorded from trigger to passenger clearance.
  - *Workforce*: Guard patrol deployment logged.
  - *Assets*: Elevator downtime linked to safety incident record.
  - *Audit*: Dispatch acknowledgement and arrival timestamps recorded.
- **Result**: **PASS**
