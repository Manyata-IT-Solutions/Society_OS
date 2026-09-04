# ADR 133: Multi-Dimensional Aging Analysis & Real-Time Receivables Projections

## Context
Property managers and managing committees need immediate visibility into overdue accounts without running expensive table scans across historical invoices.

## Decision
We maintain an asynchronous `ResidentOutstanding` projection and provide real-time aging matrix calculations bucketed by:
- `Current` (Not yet due)
- `1–30 Days`
- `31–60 Days`
- `61–90 Days`
- `90+ Days`

Aging can be aggregated across Community, Building/Tower, Floor, Billing Plan, and Account Type. Projections can be autonomously rebuilt from source invoices and allocations.

## Consequences
- Sub-second collection dashboard rendering for 10,000+ units.
- Complete projection rebuildability guarantees zero drift.