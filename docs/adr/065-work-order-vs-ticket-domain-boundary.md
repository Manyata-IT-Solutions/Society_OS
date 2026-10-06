# ADR 065: Work Order vs Ticket Strict Domain Boundary

## Status

Accepted

## Context

In Community OS, Phase 8 introduced the Helpdesk & Complaint module answering "What problem or request was reported by a resident or staff member?". Phase 9 introduces Facility Management & Work Execution answering "What physical work must be performed, by whom, where, and with what verified outcome?".
A common anti-pattern in facility systems is conflating Tickets and Work Orders into a single table. This leads to leaked internal operational details (such as contractor work logs or technical checklists) to residents, makes recurring maintenance without tickets awkward, and prevents multi-team execution where one reported issue requires multiple distinct work orders (e.g. electrical repair followed by masonry patching).

## Decision

We establish a strict, decoupled boundary between `Ticket` and `WorkOrder`:

1. **Distinct Entities**: `Ticket` represents the customer-facing incident/request; `WorkOrder` represents the authorized physical operational work task.
2. **Cardinality**: A Ticket may link to 0, 1, or many WorkOrders via explicit `TicketWorkOrderLink` relations. A WorkOrder can exist standalone (e.g. preventive maintenance, capital asset inspection) without any Ticket.
3. **Decoupled Lifecycle**: Completing a WorkOrder does NOT automatically close the parent Ticket. Staff must independently verify that the resident's issue is resolved before closing the Ticket.
4. **Privacy Isolation**: Internal labor timers, technician notes, and technician checklists remain encapsulated within WorkOrder domain and are never directly exposed to residents.

## Consequences

- Clean separation of concerns between customer service and field engineering.
- Full support for preventive maintenance without dummy tickets.
- Multi-work-order coordination for complex complaints.
