# ADR 124: BillableAccount vs User Identity & Multi-Unit Ownership Boundary

## Context
In residential communities, the financially liable party for maintenance charges is distinct from login user accounts. An owner may own 5 units, a household may have 4 residents, or a commercial unit may be occupied by a company. Equating billing liability with a user ID causes severe coupling and breaks whenever tenants move or ownership transfers.

## Decision
We create an explicit `BillableAccount` entity representing the financial obligor. It is uniquely linked to an `Organization`, `Community`, and optionally a `Unit`, `Household`, or `Resident`. Display names and contact details are snapshotted during invoice generation rather than mutating historical records.

## Consequences
- Clean separation between IAM (authentication) and Accounts Receivable (financial liability).
- Multi-unit owners can receive individual unit invoices or consolidated statements.
- Tenant departures do not orphan or alter historical invoice liability.