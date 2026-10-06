# ADR 129: Invoice Lifecycle, Line-Item Immutability & Document Archiving

## Context
Once an invoice is issued, it is a formal legal instrument. In-place edits of line items or amounts corrupt accounts receivable and audit trails.

## Decision
Invoices follow a strict status lifecycle: `DRAFT` -> `GENERATED` -> `ISSUED` -> `PARTIALLY_PAID` / `PAID` / `OVERDUE` / `WAIVED` / `CANCELLED`. Issued invoice lines are permanently immutable. Official PDF documents are generated and stored via Document Core. Corrections after issuance must use formal `CreditNote`, `DebitNote`, or `WaiverRequest` workflows.

## Consequences
- Compliant with statutory residential society accounting standards.
- Tamper-proof invoice archiving for residents and auditors.