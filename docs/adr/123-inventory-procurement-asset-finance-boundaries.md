# ADR 123: Inventory, Procurement, Asset and Finance Boundaries

## Status
Accepted

## Context
Previous phases implemented operational Inventory (Phase 11), Vendor Procurement (Phase 12), and Asset Management (Phase 10). Prematurely posting accounting entries for operational actions without valuation policy leads to bookkeeping errors.

## Decision
Establish clear domain boundaries: (1) Phase 12 Purchase Orders represent commercial commitments and do NOT post to the General Ledger. (2) Phase 11 Inventory manages stock quantities; financial valuation will post via dedicated valuation events in subsequent billing/finance phases. (3) Phase 10 Assets maintain physical registries; depreciation accounting is deferred to Fixed Asset Accounting. Finance Core provides the posting kernel for these integrations.

## Consequences
Clean domain boundaries and zero risk of premature or uncoordinated ledger mutations.
