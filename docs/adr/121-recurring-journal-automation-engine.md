# ADR 121: Recurring Journal Automation Engine

## Status
Accepted

## Context
Monthly prepaid expense amortization and routine administrative accruals require scheduled recurring journal creation.

## Decision
Create a `JournalTemplate` entity with schedule rules (monthly/quarterly) and target line configurations. A background cron worker evaluates active templates and generates `DRAFT` journal entries requiring review and approval by default, or automated posting when configured.

## Consequences
Reduces repetitive manual accounting workload while maintaining strict approval governance.
