# Accounts Payable Architecture

## Overview
The Community OS Accounts Payable (AP) subsystem manages supplier liabilities, invoice processing, automated multi-way matching against procurement commitments and goods/service receipts, and payment proposal preparation.

## Core Architectural Invariants
1. **Separation of Concerns**:
   - Procurement owns the Purchase Commitment (`PurchaseOrder`).
   - Receiving owns Goods and Service Acceptance (`GoodsReceiptNote`, `ServiceReceiptNote`).
   - Accounts Payable owns the Supplier Liability (`SupplierInvoice`, `VendorAccount`).
   - Treasury owns Payment Execution (`VendorPayment`, `BankAccount`).
   - Finance Core owns the General Ledger (`JournalEntry`, `GeneralLedgerEntry`).
2. **Subledger Model**: Vendors extend into finance via explicit `VendorAccount` and `VendorLedgerEntry` records. Financial balances are never placed on the Vendor master.
3. **Double-Entry Posting**: All AP events post to Finance Core through immutable balanced journal entries via `FinancialPostingService`.
