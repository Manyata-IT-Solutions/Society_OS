# Module Boundaries & Domain Decomposition

## 1. Domain Decomposition Overview

To prevent the modular monolith from degenerating into a "big ball of mud", Community OS enforces strict boundary definitions between domains:

| Domain                      | Core Responsibilities                                                               | Explicit Dependencies             |
| :-------------------------- | :---------------------------------------------------------------------------------- | :-------------------------------- |
| **Identity & IAM**          | Users, Authentication, Passwords, MFA, Tenant Memberships, Roles, Permissions       | None                              |
| **Organization & Property** | Organizations, Communities, Clusters, Towers, Units, Physical Layout                | Identity                          |
| **Household & Resident**    | Occupancies, Family members, Vehicles, Pets, Tenant Directory                       | Property, Identity                |
| **Helpdesk & Maintenance**  | Complaints, Tickets, SLA tracking, Categorization, Escalation                       | Property, Identity, Notification  |
| **Facility & Assets**       | Equipment inventory, Preventative maintenance, AMC vendors, Downtime tracking       | Property, Vendor                  |
| **Finance & Billing**       | Maintenance invoices, Utility meters, Ledger entries, Receipts, GST/Tax calculation | Property, Household, Notification |
| **Security & Visitors**     | Gate entries, Visitor passes, Delivery approvals, Staff check-ins, Overstay alerts  | Property, Household, Notification |
| **Amenity Booking**         | Clubhouse, Tennis courts, Slots, Cancellation policies, Pricing rules               | Property, Household, Finance      |
| **Governance & Documents**  | AGM meetings, Voting/Polling, Society By-laws, Notices, Document vault              | Property, Household               |
| **Notification Engine**     | WhatsApp, SMS, Push, Email templating and dispatch                                  | Platform Core                     |
| **Audit & Compliance**      | Immutable system event log, Security audit trail, Regulatory reports                | Platform Core                     |

---

## 2. Invariant Rules of Modularity

1. **No Cross-Domain Table Joins**:
   - Domain A cannot join directly on Domain B's private tables.
   - If Domain A needs data from Domain B, it must use Domain B's published DTO interface or listen to Domain B's domain events.
2. **Independent Migrations**:
   - Tables are grouped with domain prefixes (e.g., `fin_invoices`, `sec_visitors`, `help_tickets`).
3. **Eventual Consistency Across Domains**:
   - Cross-domain operations use saga/orchestration patterns via events rather than giant distributed database transactions across 10 tables.
4. **Service Extraction Readiness**:
   - If a domain (e.g. `Security & Visitors` with high gate-traffic throughput) ever needs to be extracted into a standalone microservice, its boundary is already cleanly decoupled at the event and DTO contract levels.
