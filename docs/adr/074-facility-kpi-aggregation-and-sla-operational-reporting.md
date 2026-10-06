# ADR 074: Facility KPI Aggregation and SLA Operational Reporting

## Status

Accepted

## Context

Property operations directors require real-time visibility into maintenance health across portfolios: Mean Time to Repair (MTTR), preventive maintenance compliance percentage, overdue ratios, unassigned backlogs, and technician utilization.

## Decision

1. `WorkOrderRepository.getKpiMetrics` aggregates active counts, unassigned counts, in-progress tasks, supervisor review queues, and overdue items in optimized SQL queries.
2. Preventive compliance is calculated as `count(completed PM on-time) / count(total scheduled PM) * 100`.
3. Integrated with Phase 7 SLA Engine to report breach warnings and resolution milestones.

## Consequences

- Real-time operational intelligence without heavy offline analytics overhead.
- Actionable dashboards for property managers and operations leads.
