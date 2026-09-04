# Community OS — Enterprise Design Principles (Phase 25.5E)

These core principles govern all user experience, design systems, component architecture, and interaction patterns across Community OS.

---

## 1. Core Design Tenets

### 1. Clarity Over Decoration
* Visual hierarchy must communicate operational state instantly. Avoid decorative gradients, floating blur effects, or unnecessary illustrations in management consoles.

### 2. Data Density Without Noise
* Enterprise township managers oversee hundreds of units, invoices, and work orders daily. Tables and lists must be compact, readable, and vertically efficient without sacrificing whitespace or contrast.

### 3. Consistency Over Novelty
* Every module must feel like part of one unified operating system. Buttons, tables, status indicators, filters, and headers must behave identically across Finance, Helpdesk, Security, and Governance.

### 4. Progressive Disclosure
* Surface primary facts and immediate actions prominently. Group secondary fields, technical metadata, and audit details into clean expandable drawers or tabs.

### 5. Role Relevance
* Operators see only what matters to their job. A security guard's interface must prioritize high-speed gate verification; a financial accountant's interface must prioritize ledger precision; a resident's interface must be clean and self-service.

### 6. Fast Scanning & Visual Anchors
* Use human-readable reference numbers (`WO-2026-00001`, `INV-2026-000101`) rather than UUIDs. Right-align all numeric and financial data. Standardize status badges with clear semantic icons and text.

### 7. Action Proximity & Context Preservation
* Primary page actions belong in the page header. Row-level actions belong in the table row or overflow menu. Switching tabs or opening drawers must never lose unsaved state or reset table filters.

### 8. Desktop ERP First, Resident Mobile First
* Desktop ERP must never be compromised into oversized mobile-first cards. Conversely, resident and security guard interfaces must be responsive, touch-friendly, and optimized for phone/tablet widths.

### 9. Predictable Navigation & Tenant Scoping
* The active Organization and Community must always be visible. Users must never be left wondering which township data they are editing.

### 10. Performance & Accessibility
* Preserve Phase 26 security and Phase 27 performance guarantees. Visible focus states (`:focus-visible`), WCAG 2.2 AA contrast ratios, and keyboard navigation are mandatory baselines.
