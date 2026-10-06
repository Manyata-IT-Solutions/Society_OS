# ADR 134: Waiver Workflow, Concession Policies, and Credit Note Foundations

## Context
Disputes, late fee waivers, or billing adjustments require strict Maker-Checker approval to prevent unauthorized financial concessions by staff.

## Decision
We implement a formal `WaiverRequest` and `CreditNote` workflow. Staff request a waiver specifying reason, amount, and target invoice. Once approved by an authorized committee member, the engine:
1. Generates a formal `CreditNote` / `Waiver` document.
2. Reduces the invoice `outstandingAmount` without editing original invoice lines.
3. Appends a `WAIVER` entry to the resident subledger.
4. Posts a debit to Concession Expense and credit to AR Control via Phase 13 Finance.

## Consequences
- Full governance and Maker-Checker compliance for all dues reductions.