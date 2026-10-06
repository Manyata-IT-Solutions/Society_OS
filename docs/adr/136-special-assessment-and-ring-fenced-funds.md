# ADR 136: Special Assessment Billing & Ring-Fenced Fund Allocation

## Context
Societies periodically raise special levies (e.g. ₹15,000 for building repainting, ₹5,000 for lift modernization) that apply to specific towers or the entire community and must be allocated to statutory ring-fenced funds (Corpus or Sinking Fund).

## Decision
We use `ChargeAssignment` to target special charges to entire communities, specific buildings, or selected units. Invoice lines attach the target `fundId` (e.g. Sinking Fund Reserve). Financial postings credit the dedicated Fund balance rather than general operational income.

## Consequences
- Direct alignment with statutory society reserve fund mandates.
- Tower-specific and project-specific capital assessments.