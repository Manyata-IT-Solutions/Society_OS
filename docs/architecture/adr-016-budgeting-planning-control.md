# ADR 016: Enterprise Budgeting, Planning & Financial Control Engine

## Status
Accepted

## Context
Community OS requires a comprehensive, multi-tenant financial planning and commitment control subsystem to manage Annual Operating Plans (AOP), capital replacement (CAPEX), ring-fenced funds, multi-scenario forecasting, and spend controls across communities and portfolios.

## Decision Drivers & Core Architectural Principles
1. **Separation of Concerns (Invariants)**:
   - Budget is not General Ledger (Phase 13).
   - Budget is not Purchase Order (Phase 12).
   - Budget is not Supplier Invoice (Phase 15).
   - Budget is not Bank Balance or Cash Flow (Phase 15).
   - Budget is not Forecast.
   - Each concept has dedicated lifecycle, immutability rules, and state representations.

2. **Budget Immutability & Formal Amendments**:
   - Approved original budgets are frozen and immutable.
   - Budget modifications strictly occur through approved `BudgetAmendment` or fund-isolated `BudgetTransfer` transactions.

3. **Append-Only Commitment Ledger**:
   - Commitments and reservations are tracked in `BudgetCommitmentEntry`.
   - Requisition (PR) -> Reservation.
   - Purchase Order (PO) -> Convert reservation to Commitment (eliminating double-counting).
   - PO Revision -> Commitment Adjustment.
   - Supplier Invoice Posted -> Consume Commitment and create GL Actual via Phase 13.

4. **Real-Time Budget Control Equation**:
   $$\text{Available Budget} = \text{Current Approved Budget} - \text{Actual Spend (GL)} - \text{Commitments} - \text{Reservations}$$
   - HARD mode: Blocks overspending unless formal amendment/override.
   - SOFT mode: Issues warning but permits workflow continuation.
   - OFF mode: Passive reporting.

5. **Multi-Dimensional Variance Analysis**:
   - Revenue Variance: Actual < Budget is Unfavorable (Collection shortfall).
   - Expense Variance: Actual > Budget is Unfavorable (Cost overrun).

## Consequences
- Guaranteed financial discipline preventing unauthorized and unbudgeted expenditures.
- Fully transparent spend pipeline from intent (PR) to commitment (PO) to realization (GL) to cash outflow (AP Payment).
