# Supplier Invoice Lifecycle

## Lifecycle States
- `DRAFT`: Initial entry, editable.
- `SUBMITTED`: Submitted for validation and matching.
- `MATCHED`: Passed 2-way / 3-way matching rules.
- `EXCEPTION`: Failed tolerance or acceptance checks; placed in Exception Inbox.
- `APPROVED`: Authorized for GL posting and payment run inclusion.
- `POSTED`: General ledger journal posted and vendor subledger credited.
- `PARTIALLY_PAID`: Outstanding amount > 0 and paid amount > 0.
- `PAID`: Outstanding amount = 0.
- `ON_HOLD`: Blocked from payment selection with explicit reason code.
- `CANCELLED` / `REVERSED`: Inactive.
