# Community OS — Enterprise Design System Specification (Phase 25.5E)

This document specifies the design tokens, component architecture, interaction patterns, and visual foundations of Community OS.

---

## 1. Color System & Semantic Tokens

### Core Color Palette
| Token | CSS Variable / Class | Light Value | Purpose |
|---|---|---|---|
| `background` | `var(--background)` | `#f8fafc` (Slate-50) | Page background |
| `surface` | `var(--surface)` | `#ffffff` (White) | Cards, modals, sidebars |
| `surface-muted`| `var(--surface-muted)` | `#f1f5f9` (Slate-100) | Secondary backgrounds, headers |
| `border` | `var(--border)` | `#e2e8f0` (Slate-200) | Dividers, table borders |
| `primary` | `var(--primary)` | `#0284c7` (Sky-600) | Primary actions, active links |
| `primary-hover`| `var(--primary-hover)` | `#0369a1` (Sky-700) | Button hover states |

### Semantic Status Tokens
| Semantic Status | Dot Color | Badge Background | Text Color | Usage Examples |
|---|---|---|---|---|
| **Success** | `bg-emerald-500` | `bg-emerald-50` | `text-emerald-700` | Active, Paid, Resolved, Fulfilled, Operational |
| **Warning** | `bg-amber-500` | `bg-amber-50` | `text-amber-700` | Pending, Under Review, In Progress, Low Stock |
| **Danger** | `bg-rose-500` | `bg-rose-50` | `text-rose-700` | Overdue, Breached, Outage, Failed, Cancelled |
| **Info** | `bg-sky-500` | `bg-sky-50` | `text-sky-700` | Dispatched, Scheduled, Submitted |
| **Neutral** | `bg-slate-400` | `bg-slate-50` | `text-slate-700` | Draft, Archived, Common |

---

## 2. Typography Hierarchy

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| **Page Title** | `1.5rem` (24px) | Bold (700) | Tight | Major screen headings (`PageHeader`) |
| **Section Title** | `1.125rem` (18px) | SemiBold (600) | Snug | Card headers, modal headers |
| **Card Title / Metric**| `1.5rem` (24px) | Bold (700) | Mono | Numerical KPI totals (`MetricCard`) |
| **Body Default** | `0.875rem` (14px) | Normal (400) | Normal | Standard body copy, inputs |
| **Dense Table Cell**| `0.75rem` (12px) | Normal (400) | Tight | Table records, metadata |
| **Secondary / Meta**| `0.6875rem` (11px)| Medium (500) | Normal | Subtitles, helper text |
| **Micro Caption** | `0.625rem` (10px) | Bold (700) | Uppercase | Category tags, sidebar group headings |

---

## 3. Spacing & Border Radii

* **Spacing Grid**: Standard 4px grid (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
* **Border Radii**:
  - `rounded-lg` (8px): Inputs, buttons, sidebar items, table cards.
  - `rounded-xl` (12px): Containers, modals, metric cards.
  - `rounded-full` (9999px): Status badges, user avatars, pill badges.
* **Shadows**: Subtle enterprise shadows (`shadow-2xs`, `shadow-sm`, `shadow-md` for modals). No heavy consumer blur shadows.

---

## 4. Reusable Enterprise Component Suite (`src/components/ui/`)

1. **`DataTable<T>`**:
   - Compact table padding (`py-2.5 px-3.5`).
   - Sticky header with uppercase column labels.
   - Built-in search filtering and pagination controls.
   - Right-aligned numeric and financial figures.
   - Standardized skeleton loading and empty state fallbacks.
2. **`PageHeader`**:
   - Automatic breadcrumb trail.
   - Title with count badges.
   - Subtitle and action button slots (Primary + Secondary).
3. **`MetricCard`**:
   - KPI title, formatted tabular numbers, trend indicators (+/- %), and attention alerts.
4. **`StatusBadge`**:
   - Unified enum-to-label formatter with colored status dots.
5. **`FormField`**:
   - Structured label, explicit red asterisk required indicator, helper text, and inline validation error display.
6. **`EmptyState` & `ErrorState`**:
   - Informative vector icons, clear titles, recovery CTA buttons.
7. **`Formatters` (`formatMoney`, `formatDate`, `formatDateTime`, `formatStatus`)**:
   - Central Indian Rupee (INR) currency formatting (`₹3,800.00`).
   - Standard en-IN date presentation (`14 Apr 2026`).
