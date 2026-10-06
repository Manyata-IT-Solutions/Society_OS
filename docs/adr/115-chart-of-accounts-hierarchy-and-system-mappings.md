# ADR 115: Chart of Accounts Hierarchy and System Mappings

## Status
Accepted

## Context
Subsystem modules (e.g. Accounts Receivable, Accounts Payable, Inventory Valuation) need to post to specific control accounts without hard-coding database primary keys.

## Decision
Support a hierarchical Chart of Accounts (Asset, Liability, Fund/Equity, Income, Expense) distinguishing header accounts (non-posting) from leaf posting accounts. System accounts are mapped using stable keys (e.g. `AR_CONTROL`, `AP_CONTROL`, `BANK_PRIMARY`, `GENERAL_FUND`) via an `AccountMapping` registry. Direct manual journal entries to control accounts are blocked by default to prevent subledger divergence.

## Consequences
Enables flexible tenant-specific COA structures while preserving seamless integration for automated subsystem posting.
