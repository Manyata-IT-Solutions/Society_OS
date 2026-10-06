# ADR-020: CSV Import Validation Pipeline & Formula Sanitization

## Status

Accepted

## Context

Initial migration of property masters into Community OS relies heavily on legacy spreadsheets and CSV exports from previous software. Legacy data frequently contains syntax errors, missing columns, or formula injection characters (`=`, `+`, `-`, `@`).

## Decision

1. Implement a 2-stage import process (`/validate` returning row-by-row error breakdowns without writing to the database, followed by `/commit`).
2. Prefix all values starting with formula execution characters (`=`, `+`, `-`, `@`) with a single quote (`'`) during CSV export.

## Consequences

- **Positive**: Complete defense against spreadsheet formula injection and zero corrupt database states from malformed import files.
- **Negative**: Adds a validation roundtrip before commit.
