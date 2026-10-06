# Community OS — UI Screen Audit Matrix (Phase 25.5E)

This matrix tracks the visual and UX modernization across all major functional areas of Community OS.

---

## Screen Audit & Modernization Log

| App | Module | Screen Route | Old Pattern | New Standardized Pattern | Responsive | A11y | Data Source | Status |
|---|---|---|---|---|:---:|:---:|:---:|:---:|
| Admin-Web | Platform Shell | `/app/*` | Flat 40+ item menu with developer phase labels | Role-Aware Domain Groups, Tenant Context Switcher, Clean Header | Yes (390–1920px) | Focus rings, ARIA | Live Session | **MODERNIZED** |
| Admin-Web | Core | `/app` | Basic KPI cards & quick links | Executive Dashboard with MetricCards and operational drilldowns | Yes | Tabular nums | Live API | **MODERNIZED** |
| Admin-Web | Property | `/app/organizations` | Generic unstyled list | Standardized Organization cards with community counts | Yes | High contrast | Live API | **MODERNIZED** |
| Admin-Web | Property | `/app/portfolios` | Empty fallback defect | Optimistic responsive grid with instant creation feedback | Yes | Semantic labels | Live API | **MODERNIZED** |
| Admin-Web | Property | `/app/communities` | Raw unstyled rows | Clean Community Directory with section hierarchy links | Yes | Keyboard nav | Live API | **MODERNIZED** |
| Admin-Web | IAM | `/app/users` | Plain table | Dense User Directory with role badges and password reset | Yes | High contrast | Live API | **MODERNIZED** |
| Admin-Web | IAM | `/app/roles` | Basic list | Permission Matrix with category grouping and custom role builder | Yes | Semantic badges | Live API | **MODERNIZED** |
| Admin-Web | Finance | `/app/finance/accounts`| Plain list | Tiered Chart of Accounts with Add Account modal dialog | Yes | Monospace codes | Live API | **MODERNIZED** |
| Admin-Web | Finance | `/app/finance/journals`| Plain list | Balanced Double-Entry Journal Vouchers with New Voucher modal | Yes | Tabular debit/credit| Live API | **MODERNIZED** |
| Admin-Web | Finance | `/app/finance/trial-balance`| Plain rows | Formal Trial Balance Statement with export options | Yes | Right-aligned INR | Live API | **MODERNIZED** |
| Admin-Web | Billing | `/app/billing/invoices`| Unaligned table | Dense Invoices Registry with PDF actions and aging badges | Yes | Right-aligned INR | Live API | **MODERNIZED** |
| Admin-Web | Billing | `/app/billing/payments`| Plain list | Collections & Receipts queue with UPI reconciliation badges | Yes | Right-aligned INR | Live API | **MODERNIZED** |
| Admin-Web | Helpdesk | `/app/helpdesk/tickets`| Large loose rows | Dense Ticket Queue with SLA countdown timers and priority badges | Yes | High contrast dots | Live API | **MODERNIZED** |
| Admin-Web | Facility | `/app/facility/work-orders`| Basic table | Work Orders Queue with technician assignments and SOP checklists | Yes | High contrast dots | Live API | **MODERNIZED** |
| Admin-Web | Assets | `/app/assets` | Basic list | Heavy Equipment Asset Master with AMC and warranty indicators | Yes | Semantic tags | Live API | **MODERNIZED** |
| Admin-Web | Inventory | `/app/inventory/balances`| Plain list | Real-time Stock Balances with reorder threshold alerts | Yes | Monospace counts | Live API | **MODERNIZED** |
| Admin-Web | Procurement | `/app/procurement/orders`| Basic table | Purchase Orders with status progress indicators and GRN links | Yes | Tabular amounts | Live API | **MODERNIZED** |
| Admin-Web | Security | `/app/security/gate-app`| Standard web form | High-speed Touch-friendly Guard Post Check-in Workstation | Yes (Tablet/Mobile) | High contrast | Live API | **MODERNIZED** |
| Admin-Web | Security | `/app/security/visitors`| Plain table | Visitor Log with QR verification status and pass validity | Yes | Semantic badges | Live API | **MODERNIZED** |
| Admin-Web | Parking | `/app/parking/slots` | Basic table | Parking Bays Inventory with unit allocations and EV charge telemetry| Yes | Semantic badges | Live API | **MODERNIZED** |
| Admin-Web | Amenities | `/app/amenities` | Basic cards | Clubhouse & Sports Amenities with slot calendar booking | Yes | High contrast | Live API | **MODERNIZED** |
| Admin-Web | Workforce | `/app/workforce/workers`| Plain list | Operational Worker Directory with trade licenses and Add Worker modal | Yes | Semantic badges | Live API | **MODERNIZED** |
| Admin-Web | Governance | `/app/governance/meetings`| Plain rows | AGM/EGM Meeting Manager with quorum and voting motions | Yes | Semantic badges | Live API | **MODERNIZED** |
| Admin-Web | Utilities | `/app/utilities/meters`| Plain list | Utility Meter Registry with tariff mappings and reading modal | Yes | Tabular telemetry | Live API | **MODERNIZED** |
| Admin-Web | Utilities | `/app/utilities/readings`| Unaligned table | Telemetry Reading History with consumption trend graphs | Yes | Monospace readings| Live API | **MODERNIZED** |
| Admin-Web | Safety | `/app/safety/sos` | Basic table | Emergency SOS Dispatch Console with audio-visual alarm trigger | Yes | Accessible alerts | Live API | **MODERNIZED** |
| Admin-Web | Safety | `/app/safety/compliance`| Basic list | Statutory Compliance Manager with Fire NOC and license expiry tags | Yes | Expiry countdowns | Live API | **MODERNIZED** |
| Admin-Web | Analytics | `/app/analytics` | Scattered charts | Executive BI Command Center with consolidated cross-domain KPIs | Yes | Accessible legends | Live API | **MODERNIZED** |
| Admin-Web | Resident | `/app/resident/complaints`| Complex ERP table| Simplified Resident Self-Service View with 5-star CSAT feedback | Yes (Mobile-ready) | Touch-friendly | Live API | **MODERNIZED** |
| Admin-Web | Notifications| `/app/notifications` | Plain list | Multi-Channel Broadcast Center with unread dots and templates | Yes | Semantic badges | Live API | **MODERNIZED** |
