# ADR 094: Inventory Valuation Readiness & Financial Accounting Deferral

## Status

**ACCEPTED**

## Context

While stock quantities must be exact today, full financial accounting (General Ledger, Cost of Goods Sold, FIFO/Moving Average cost layers, tax accounting) belongs to future financial modules.

## Decision

Design data structures with unitPrice and currency metadata for valuation readiness, but defer financial GL posting and COGS calculation to the upcoming Financial Accounting phase. Phase 11 focuses exclusively on physical stock truth, operational ledger movements, and material reservations.

## Consequences

Zero premature financial coupling, clean domain boundaries, immediate operational utility with seamless future financial integration.
