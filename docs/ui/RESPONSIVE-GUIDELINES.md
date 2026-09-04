# Community OS — Responsive UX Guidelines (Phase 25.5E)

This document establishes responsive breakpoint behaviors across all supported screen resolutions for Community OS.

---

## 1. Supported Breakpoint Specifications

| Device Type | Viewport Width | Sidebar Behavior | Table Behavior | Dashboard Cards |
|---|---|---|---|---|
| **Large Desktop** | 1920px+ | Fixed Left Sidebar (256px) | Full dense data columns visible | 4-column metric grid |
| **Standard Laptop** | 1440px | Fixed Left Sidebar (256px) | Standard dense data columns | 4-column metric grid |
| **Compact Laptop** | 1366px | Fixed Left Sidebar (256px) | Standard dense data columns | 3–4 column metric grid |
| **Small Laptop** | 1280px | Fixed Left Sidebar (256px) | Controlled horizontal table scroll | 3-column metric grid |
| **Tablet Landscape**| 1024px | Collapsible Left Sidebar | Horizontal table scroll with sticky header | 2-column metric grid |
| **Tablet Portrait** | 768px | Off-canvas drawer (tap overlay) | Horizontal table scroll with sticky header | 2-column metric grid |
| **Mobile Phone** | 390px | Off-canvas drawer (tap overlay) | Card view / key columns only | 1-column metric stack |

---

## 2. Core Responsive Principles

### 1. Desktop ERP First for Operations
- Management ERP modules (Finance, Procurement, Workforce, Engineering) are designed primarily for desktop and laptop environments.
- On tablet or smaller viewports, dense tables must never be artificially broken into oversized cards that obscure data density; instead, controlled horizontal scrolling with sticky headers preserves tabular integrity.

### 2. Touch-Friendly Mobile First for Residents & Security Guards
- Resident screens (`/app/resident/complaints`, `/app/billing/invoices`, `/app/amenities`) and Guard Post tools (`/app/security/gate-app`) provide 44px+ minimum touch targets, thumb-accessible primary action buttons, and clear stacked card layouts on mobile viewports.
