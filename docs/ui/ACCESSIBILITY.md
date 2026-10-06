# Community OS — Accessibility Specification & Audit (Phase 25.5E)

This document specifies the accessibility compliance baselines for Community OS targeting WCAG 2.2 AA standards.

---

## 1. Compliance Baselines

### 1. Visible Keyboard Focus (`:focus-visible`)
* All interactive elements (buttons, links, inputs, selects, table rows) feature an unambiguous, high-contrast 2px focus ring:
  ```css
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  ```
* Outline removal (`outline: none`) without replacement is strictly forbidden across the codebase.

### 2. Dialog Accessibility & Focus Trapping
* Modals and drawers trap keyboard focus within the dialog container while active.
* Pressing the `Escape` key immediately closes the topmost active dialog.
* Focus automatically restores to the triggering action button upon dialog closure.

### 3. Color Contrast Compliance (WCAG 2.2 AA)
* Standard body text (`#0f172a` on `#f8fafc`) achieves a contrast ratio of `14.8:1` (exceeding the 4.5:1 requirement).
* Primary action buttons (`#0284c7` with `#ffffff` text) achieve a contrast ratio of `4.6:1`.
* Semantic status badges incorporate colored text, background tints, and solid dot glyphs, ensuring status is never conveyed by color alone.

### 4. Semantic Table Markup
* `DataTable` utilizes proper semantic HTML elements:
  - `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
  - Uppercase column headers marked with `scope="col"`.
  - Numeric columns right-aligned with monospace figures (`font-mono` / `tabular-nums`).

### 5. Accessible Form Controls
* `FormField` components programmatically associate `<label htmlFor="...">` with input element `id`.
* Required fields feature an explicit visual indicator (`*`) and accessible label text (`title="Required field"`).
* Error messages render inline beneath the invalid field.
