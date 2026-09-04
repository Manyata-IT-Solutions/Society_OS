# Enterprise Budgeting, Planning & Financial Control Subsystem

## Overview
Phase 16 establishes the financial planning and commitment control layer of Community OS.

## 1. Domain Chain
```
PLAN (AOP / Template)
  │
  ▼
APPROVE (Workflow & Governance)
  │
  ▼
CONTROL (Hard / Soft Real-Time Check)
  │
  ▼
COMMIT (PR Reservation -> PO Commitment)
  │
  ▼
ACTUAL (Phase 13 General Ledger Posting)
  │
  ▼
FORECAST (Latest Estimate / Run Rate)
  │
  ▼
ANALYZE (Budget vs Actual & Variance Logs)
```

## 2. Spend Pipeline Lifecycle
1. **Requisition (PR)**: Checked against available budget. If within limits, creates a `RESERVATION`.
2. **Purchase Order (PO)**: Automatically converts the PR `RESERVATION` into a `COMMITMENT`.
3. **PO Revision**: Appends a `COMMITMENT_ADJUSTMENT` entry.
4. **Supplier Invoice**: When posted to Phase 13 GL, consumes the PO `COMMITMENT` and records `GeneralLedgerEntry` Actuals.
5. **PO Cancellation**: Appends `COMMITMENT_RELEASE` returning funds to available balance.

## 3. Ring-Fenced Fund Planning
- Dedicated `FundPlan` records safeguard statutory sinking fund reserves and capital replacement plans.
- Cross-fund budget transfers are strictly restricted to maintain legal compliance.
