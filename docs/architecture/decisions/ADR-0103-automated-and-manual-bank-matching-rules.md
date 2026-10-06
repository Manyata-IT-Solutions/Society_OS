# ADR-0103: Automated and Manual Bank Matching Rules

## Status
Accepted

## Context
Community OS requires enterprise-grade Accounts Payable and Treasury operations that maintain strict separation between procurement commitments, physical receiving, supplier liabilities, and bank disbursements.

## Decision
We establish:
1. Explicit `VendorAccount` subledger entities connecting vendors to accounting entities.
2. Strict 2-way and 3-way matching engine evaluating invoice lines against PO lines and posted GRN/service acceptance records.
3. Cryptographic deduplication fingerprints for bank statements and invoices.
4. Direct GL posting bridge via `FinancialPostingService` without raw GL table mutations.

## Consequences
- Guarantees financial integrity and auditability.
- Prevents overpayment, duplicate payment, and unapproved price variances.
