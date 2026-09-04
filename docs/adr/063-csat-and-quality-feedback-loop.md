# ADR 063: CSAT and Quality Feedback Loop

## Context

Measuring resident satisfaction after complaint resolution is essential for maintaining property management standards, vendor evaluation, and technician performance tracking.

## Decision

We implement a dedicated `TicketFeedback` model:

1. **Post-Resolution Prompt**: When a ticket transitions to `RESOLVED` or `CLOSED`, residents receive a prompt to rate the service from 1 to 5 stars with optional commentary.
2. **Immutability & Integrity**: Feedback ratings are immutable once submitted.
3. **KPI Projection**: Feedback aggregates contribute directly to community-wide CSAT KPI analytics and satisfaction dashboards.

## Consequences

- **Positive**: Closed feedback loop directly tied to ticket records and performance analytics.
- **Negative**: Feedback collection is voluntary and requires periodic reminder notifications.
