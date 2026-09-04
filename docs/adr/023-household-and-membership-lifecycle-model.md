# ADR-023: Household & Membership Lifecycle Model

## Status

Accepted

## Context

Residential living arrangements change dynamically as family members join, leave, or change primary contact roles. Associating residents directly to a unit without an intermediate household grouping makes it impossible to represent living units with historical integrity.

## Decision

We introduce `Household` as a time-bounded group tied to a `Unit`, with `HouseholdMember` associations representing individual resident roles (`SELF`, `SPOUSE`, `CHILD`, `PARENT`, `SIBLING`, `RELATIVE`, `DOMESTIC_STAFF`, `OTHER`). Each household designates exactly one `primaryContactResidentId`.

## Consequences

- **Positive**: Clean tracking of household composition over time.
- **Positive**: Accurate primary contact resolution for billing and emergency dispatch.
- **Trade-off**: Requires managing two relational entities (`Household` and `HouseholdMember`).
