# Enterprise Resident Maintenance Billing & AR Architecture

## 1. Domain Overview
The Resident Maintenance Billing & Accounts Receivable module provides end-to-end management of society tariffs, batch invoice generation, payment receipting, smart allocation, and subledger reconciliation.

## 2. Component Diagram
```
[ Charge Catalog & Rules ] -> [ Billing Plan ] -> [ Liability Resolver ]
                                                      |
                                               [ BillingRun ]
                                                      |
                                          +-----------+-----------+
                                          |                       |
                                   [ BillingSnapshot ]    [ Invoices & Lines ]
                                                                  |
                                                      [ Resident Ledger ]
                                                                  |
                                                  [ Phase 13 Posting Engine ]
```

## 3. Financial Invariants
1. `Invoice Grand Total = Subtotal - Discounts - Waivers + Penalties + Interest`.
2. `Invoice Outstanding = Grand Total - Total Allocated`.
3. `Resident Balance = Sum(Debits) - Sum(Credits)`.
4. `Allocated Payment Amount <= Received Payment Amount`.
5. `Unallocated Amount = Payment Amount - Sum(Allocations)`.
