# ADR 138: Resident Self-Service Financial Privacy & Scoped Access Controls

## Context
Financial records, dues, and payment histories are highly confidential. Residents must strictly see only invoices and receipts belonging to their own billable account.

## Decision
All billing controllers enforce scoped IAM permission checks (`billing.invoice.view`, `billing.receipt.view`, `billing.resident_ledger.view`). If the authenticated user has resident-level scope, queries are strictly constrained to the user's active `BillableAccount`. Cross-account inspection is rejected with `403 Forbidden`.

## Consequences
- Enterprise tenant and resident data privacy.
- Secure, self-service viewing and downloading of invoices and receipts.