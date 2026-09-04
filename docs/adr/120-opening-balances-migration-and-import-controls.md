# ADR 120: Opening Balances Migration and Import Controls

## Status
Accepted

## Context
Onboarding new communities requires migrating legacy opening balances. Importing unbalanced numbers would permanently corrupt financial statements.

## Decision
Opening balances are imported via CSV through a controlled 4-step wizard (Upload -> Validate & Preview -> Approve -> Post). The engine validates that total opening debits equal total opening credits before generating an `OPENING` journal entry.

## Consequences
Zero risk of corrupt opening ledger states. Seamless onboarding for existing residential societies.
