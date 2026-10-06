# Community OS — Page Pattern Standards (Phase 25.5E)

This document establishes the seven canonical page patterns used across Community OS to ensure structural consistency across all 28 domains.

---

## Pattern 1: Executive & Operational Dashboard
- **Structure**:
  1. Top `PageHeader` with active township date range selector.
  2. 3–4 `MetricCard` KPI indicators answering: *What happened? What needs immediate attention?*
  3. Two-column or full-width operational queue (e.g. Urgent Helpdesk Tickets, Open Work Orders, Collections Breakdown).
  4. Quick action buttons for high-frequency workflows.
- **Example Modules**: `/app` (Platform Overview), `/app/finance` (Financial Command), `/app/helpdesk` (Service Center).

---

## Pattern 2: Enterprise Dense Data List
- **Structure**:
  1. Top `PageHeader` with title, total record count badge, and Primary Action (e.g. "+ New Record").
  2. Quick filter tabs (e.g. *All*, *Active*, *Pending Review*, *Archived*).
  3. `DataTable` container with search toolbar, compact rows (38px height), right-aligned currency, formatted status badges, and pagination footer.
- **Example Modules**: `/app/billing/invoices`, `/app/facility/work-orders`, `/app/residents`, `/app/inventory/balances`.

---

## Pattern 3: Entity 360 Detail View
- **Structure**:
  1. Breadcrumbs leading back to parent list.
  2. Entity Header: Human-readable reference number (`WO-2026-00001`, `AST-LIFT-01`), Title, Status Badge, and Primary Action buttons.
  3. Summary Cards: Key facts, owner/assignee, financial totals, dates.
  4. Tabbed Sub-Panels:
     - Overview / Checklists
     - Linked Records (Work Orders $\leftrightarrow$ Tickets $\leftrightarrow$ Assets)
     - Audit & Activity Timeline
- **Example Modules**: `/app/communities/[id]/units/[unitId]`, `/app/helpdesk/tickets/[id]`, `/app/assets/[id]`.

---

## Pattern 4: Multi-Section Business Form
- **Structure**:
  1. Header with clear purpose and Back link.
  2. 1-to-2 column structured layout with maximum reading width (max-w-4xl).
  3. Grouped fieldsets with descriptive section titles.
  4. `FormField` components with explicit required markers and helper text.
  5. Sticky bottom bar with Cancel and Primary Submit buttons.
- **Example Modules**: `/app/resident/complaints/new`, `/app/organizations/[id]/communities/new`.

---

## Pattern 5: Action & Confirmation Dialog
- **Structure**:
  1. Centered modal dialog (`max-w-md` to `max-w-lg`) with backdrop blur.
  2. Header with title and close icon (`X`).
  3. Focused form fields or confirmation prompt specifying the exact record target.
  4. Footer with Cancel and Confirm/Save buttons.
- **Example Modules**: Record creation modals across Chart of Accounts, Roster, and Utility meters.

---

## Pattern 6: High-Speed Operational Workstation
- **Structure**:
  1. Minimal chrome, high touch target sizes (44px+) for barcode/tablet operation.
  2. High-contrast status verification banners (`VALID`, `EXPIRED`, `DENIED`).
  3. Direct scan/search input with instant camera or hardware barcode trigger.
- **Example Modules**: `/app/security/gate-app` (Guard Post Console), `/app/inventory/scan`.

---

## Pattern 7: Resident Self-Service Portal
- **Structure**:
  1. Mobile-friendly cards prioritized for phone/tablet widths.
  2. Prominent account balance with "Pay Now" UPI call-to-action.
  3. Direct shortcuts: Invite Visitor, Book Amenity, File Complaint, Society Notices.
- **Example Modules**: `/app/resident/complaints`, `/app/billing/invoices` (Resident view).
