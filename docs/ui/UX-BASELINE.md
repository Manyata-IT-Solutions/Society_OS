# Community OS — UI/UX Baseline Audit (Phase 25.5E)

This document captures the pre-redesign baseline across `apps/admin-web`, cataloging user experience pain points, visual inconsistencies, navigation debt, and component duplication across all 142 screens.

---

## 1. Executive Summary & Classification of UX Debt

| Severity | Category | Description | Impact |
|---|---|---|---|
| **HIGH** | Navigation & Information Architecture | Sidebar displays flat 40+ item menu with developer-centric phase labels (e.g. `Core & Property (Phases 1-4)`, `Shared Engines (Phases 5-7)`). Irrelevant modules shown to operational roles. | Overwhelming cognitive load; guards and residents see ERP admin screens. |
| **HIGH** | Header & Tenant Switcher | Header does not clearly indicate active Organization and Community; switching between Northstar and Demo Corp lacks immediate visual confirmation. | Operator confusion regarding which society's data is currently active. |
| **MEDIUM** | Component Duplication & Table Inconsistencies | Each module implements ad-hoc table containers with varying padding, row heights (48px vs 64px), and unaligned numeric columns. | Visual fragmentation; numbers not right-aligned; missing standardized pagination. |
| **MEDIUM** | Status Badge Inconsistencies | Raw backend enums (e.g. `UNDER_SUPERVISOR_REVIEW`, `AWAITING_APPROVAL`) rendered directly in text with arbitrary background colors. | Poor scanability; lack of unified semantic tokens. |
| **LOW** | Form & Modal Density | Forms and action modals lack consistent spacing, explicit required indicators, and helper text conventions. | Suboptimal data entry speed for high-volume transactions. |
| **COSMETIC**| Spacing & Radius Variations | Inconsistent border radius (`rounded-md` vs `rounded-xl` vs `rounded-2xl`) and shadow styling across modules. | Lack of unified enterprise polish. |

---

## 2. Layouts & Navigation Model
* **Current Layout**: Fixed left sidebar (`w-64`), sticky top header (`h-16`), main content scroll area (`overflow-y-auto`).
* **Shortcomings**:
  1. Section headers in sidebar expose internal development phases (`Phases 1-4`, `Phases 8-10`, `Phases 17-20`), creating an unpolished impression.
  2. Sidebar is not role-filtered. A Security Guard or Resident sees Financial Journals, Chart of Accounts, and Work Package BOQs in the sidebar.
  3. Tenant Switcher in sidebar links to `/app/organizations` rather than providing an instant scoped dropdown for Organization and Community selection.

---

## 3. Typography & Spacing Baseline
* **Font Family**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`).
* **Scale**: Varied from `text-[10px]` to `text-3xl` without structured semantic token definitions.
* **Numbers**: Currency and metrics formatted manually (`₹${amount}` or `INR ${amount}`) with irregular decimal precision and no tabular numerals (`font-mono` / `tabular-nums`).

---

## 4. Enterprise Tables & Data Grids
* Tables across `/app/finance`, `/app/billing`, `/app/inventory`, and `/app/helpdesk` implement custom `<table>` elements without a unified shared `DataTable` primitive.
* Currency, stock quantities, and percentages are often left-aligned rather than right-aligned.
* Empty states vary from blank tables to generic "No data" strings.

---

## 5. Forms, Modals & Dialogs
* Action dialogs implemented across screens use varying modal widths (`max-w-md`, `max-w-lg`, `max-w-2xl`) without standard responsive padding.
* Destruction actions (e.g. session revocation, record deletion) occasionally lack explicit confirmation warnings.
