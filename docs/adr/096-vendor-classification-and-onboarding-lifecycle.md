# ADR-096: Vendor Classification and Onboarding Lifecycle

## Status
Accepted

## Context
Vendors possess varying capabilities (materials suppliers, AMC service providers, turnkey contractors) and require structured vetting before commercial commitments are awarded.

## Decision
1. Support bounded vendor types: `SUPPLIER`, `SERVICE_PROVIDER`, `CONTRACTOR`, `CONSULTANT`, `AMC_PROVIDER`, `UTILITY_PROVIDER`, `OTHER`.
2. Implement a strict onboarding lifecycle: `DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` (or `REJECTED`).
3. Operational status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `BLACKLISTED`, `ARCHIVED`) is separated from onboarding state.

## Consequences
- Vendor records cannot participate in sourcing awards or receive Purchase Orders unless their onboarding is `APPROVED` and operational status is `ACTIVE`.