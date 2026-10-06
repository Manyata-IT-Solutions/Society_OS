# ADR 017: Enterprise Projects & CAPEX Execution Architecture

## Status
Accepted

## Context
Community OS requires a bounded, enterprise-grade capital project and works execution system to govern civil works, lift modernizations, infrastructure replacements, and renovations across residential communities.

## Core Architectural Invariants
1. **Separation of Domains**:
   - **Phase 16 plans the money** (AOP, CapexInitiative, BudgetControlEngine).
   - **Phase 17 executes the project** (Scope, BOQ, Packages, Milestones, Measurements, IPC/RA Bills, Variations, Snags, Handover).
   - **Phase 12 procures** (PR, RFQ, PO, Vendor).
   - **Phase 15 pays** (Supplier Invoices, Retention, Advances, Payments).
   - **Phase 13 posts accounting** (General Ledger, Cost Centers, Funds, Actuals).
   - **Phase 10 owns operational assets** (Asset Master, Warranties, Commissioning).
   - **Phase 9 executes operational maintenance** (Work Orders).
   - Do NOT collapse or duplicate these domains.

2. **Approved BOQ Immutability & Revisions**:
   - Approved Bill of Quantities cannot be directly edited in place.
   - Any change generates a new `BOQRevision` preserving old tender baselines.

3. **Strict Quantity Control & Concurrency Safety**:
   $$\text{Certified Quantity} \le \text{Verified Measured Quantity} \le \text{Allowed BOQ Quantity} + \text{Approved Variation Quantity}$$
   - Over-measurement and over-certification are blocked with deterministic database transactions.

4. **Budget-Controlled Change Orders**:
   - Any cost-increasing variation invokes Phase 16 `BudgetControlEngine`. If insufficient budget remains, the variation is blocked until a formal Phase 16 budget amendment is approved.

5. **Segregation of Duties (Maker-Checker)**:
   - Contractor/technician submits measurements.
   - Site engineer verifies.
   - Project manager certifies IPC / RA bill.
   - Finance/AP posts and pays supplier invoice.
   - Contractor cannot self-certify.
