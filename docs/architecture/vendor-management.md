# Vendor Management Architecture

## Overview
Vendor Management in Community OS provides enterprise organization-level vendor master records, contact directories, tax profiles (GSTIN/PAN/MSME/VAT), compliance document tracking, onboarding approval workflows, and objective performance scorecards.

## Key Capabilities
1. **Organization-Level Scope**: Vendors are registered once per Organization and linked across multiple Communities.
2. **Onboarding Lifecycle**: Multi-step maker-checker review from `DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED`.
3. **Compliance & Expiry Monitoring**: Document tracking for statutory certificates with automated expiry warnings via Scheduler.
4. **Suspension & Blacklisting**: Audited status transitions with mandatory justification preventing active procurement awards.
5. **Deterministic Scorecards**: Metric-driven performance tracking across On-Time Delivery, Quality Acceptance, Fulfillment, and Response rates.
