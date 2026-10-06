# ADR 077: Two-Dimensional Asset Status Model (Lifecycle State vs Operational Status)

## Status

Accepted

## Context

An asset's operational condition is orthogonal to its administrative lifecycle. An asset can be administratively `ACTIVE` while physically `UNDER_MAINTENANCE` or `OUT_OF_SERVICE` due to a breakdown. Conversely, an asset that is `COMMISSIONED` may be fully `OPERATIONAL` but waiting for building handover.
Merging lifecycle and health into a single status field causes ambiguous state transitions and breaks automated scheduling.

## Decision

We model asset state along two orthogonal dimensions:

1. **Administrative Lifecycle State (`lifecycleState`)**:
   - `REGISTERED`: Onboarded into system, pending physical installation.
   - `INSTALLED`: Placed in physical building/room, awaiting commissioning checks.
   - `COMMISSIONED`: Inspected, tested, and certified for operation.
   - `ACTIVE`: In active service for property operations.
   - `SUSPENDED`: Temporarily taken offline for seasonal or tenant reasons.
   - `DECOMMISSIONED`: Permanently retired from service.
   - `DISPOSED`: Scrapped, sold, or recycled.
2. **Real-Time Operational Health (`operationalStatus`)**:
   - `OPERATIONAL`: Running normally within specifications.
   - `DEGRADED`: Operating at reduced capacity or with non-critical warnings.
   - `UNDER_MAINTENANCE`: Currently undergoing scheduled preventive maintenance or repair.
   - `OUT_OF_SERVICE`: Inoperative due to breakdown, power failure, or emergency trip.
3. **Physical Condition Rating (`condition`)**: `GOOD`, `FAIR`, `POOR`, `CRITICAL`, `UNKNOWN`.

## Consequences

- Preventive maintenance schedules continue generating work orders for `ACTIVE` assets regardless of transient maintenance status.
- Real-time facility dashboards can immediately distinguish between equipment breakdowns and planned decommissionings.
