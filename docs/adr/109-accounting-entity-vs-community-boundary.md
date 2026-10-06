# ADR 109: Accounting Entity vs Community Boundary

## Status
Accepted

## Context
In Community OS, an Organization represents a legal enterprise tenant that may govern multiple residential or commercial Communities. In financial accounting, each distinct legal entity, registered society (RWA/AOA), or commercial subsidiary requires its own separate Chart of Accounts, General Ledger, Fiscal Calendar, and statutory reporting scope. Conflating Community directly with legal entity prevents multi-community consolidated accounting or single-community multi-entity holding structures.

## Decision
Introduce an explicit `AccountingEntity` domain entity. Each AccountingEntity belongs to an Organization and may optionally link to a specific Community. An AccountingEntity possesses its own Base Currency (ISO 4217), Chart of Accounts, Fiscal Calendar, and General Ledger. Cross-entity journal entries are strictly forbidden at the posting engine level to guarantee legal entity isolation.

## Consequences
Enables flexible 1:1, 1:N, or standalone accounting configurations. Ensures financial data boundaries are governed by legal entity definitions rather than physical property boundaries.
