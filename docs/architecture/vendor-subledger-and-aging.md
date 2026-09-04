# Vendor Subledger and Aging

## Aging Classification
- Not Due (due date > asOfDate)
- 0 to 30 Days Past Due
- 31 to 60 Days Past Due
- 61 to 90 Days Past Due
- 91 to 120 Days Past Due
- 120+ Days Past Due

## Subledger Integrity
- Append-only vendor ledger entries maintain continuous running balances.
- Automated integrity engine reconciles total subledger payable against GL AP Control Account (`2110`).
