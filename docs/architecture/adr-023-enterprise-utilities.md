# ADR 023: Enterprise Utilities, Sub-Metering, Consumption, Tariffs, Resource Balances & Sustainability

## Status
Accepted

## Context
Residential and commercial housing societies require auditable management for multi-source electricity, fresh and recycled water, piped natural gas, emergency diesel generators, rooftop solar arrays, sewage and water treatment plants, tanker water verification, and sub-metered billing handoffs.

## Decision Invariants
1. **UTILITY METER ≠ ASSET**: `UtilityMeter` models commercial, legal, and operational flow metering. It may reference physical hardware in Phase 10 `Asset` if registered.
2. **READING ≠ CONSUMPTION**: Readings are cumulative point-in-time measurements. Consumption is derived periodically using validated deltas, multipliers, and rollover math.
3. **CONSUMPTION ≠ BILL**: Consumption records physical usage. The tariff engine calculates gross and net charges, while Phase 14 generates authoritative resident invoices and manages accounts receivable.
4. **PHASE 14 BILLING INTEGRATION**: Phase 23 hands off calculated charges idempotently. Phase 14 creates invoice line items and Phase 13 posts accounting journal entries.
5. **IMMUTABILITY**: Approved meter readings, published tariff plan versions, issued invoices, and historical allocation snapshots cannot be mutated.
6. **DECIMAL PRECISION**: All readings, consumption figures, slab rates, and money values use database `Decimal` to eliminate floating-point rounding errors.
7. **SERVER-SIDE TRUST**: Clients submit reading values and timestamps; the server computes consumption deltas, evaluates progressive tariff slabs, validates anomalies, and assesses balances.
