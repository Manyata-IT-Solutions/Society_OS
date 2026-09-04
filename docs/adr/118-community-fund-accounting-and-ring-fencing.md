# ADR 118: Community Fund Accounting and Ring-Fencing

## Status
Accepted

## Context
Housing societies and community associations manage statutory restricted funds (e.g. Sinking Fund, Corpus Fund, Major Repair Reserve) that must not be commingled with the General Operating Fund.

## Decision
Model `Fund` as a first-class financial dimension with `UNRESTRICTED`, `RESTRICTED`, and `DESIGNATED` classifications. Every balance sheet and income/expense journal line can carry a `fundId`. Financial reporting generates fund-wise Trial Balances and surplus/deficit statements without fragmenting the General Ledger into separate databases.

## Consequences
Meets statutory housing society compliance requirements for reserve fund ring-fencing while preserving unified accounting reporting.
