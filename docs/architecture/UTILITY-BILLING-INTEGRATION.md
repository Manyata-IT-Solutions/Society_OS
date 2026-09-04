# Utility Billing Handoff & Tariff Calculation Engine

## Overview
- **Tariff Plan Versioning**: Supports fixed charges, per-unit rates, progressive slabs, and minimum charges.
- **Handoff**: Idempotent handoff to Phase 14 Billing Engine.
- **Adjustments**: Corrections post-billing generate controlled debit/credit adjustments rather than mutating issued invoices.
