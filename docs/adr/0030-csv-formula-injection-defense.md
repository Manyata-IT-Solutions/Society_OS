# ADR-0030: CSV Formula Injection Defense Across Export Services

## Status
Accepted

## Context
Exporting user-provided names, ticket descriptions, and unit numbers into CSV or Excel format can lead to formula injection attacks if cells begin with `=`, `+`, `-`, or `@`.

## Decision
1. All tabular exports sanitize user-generated strings using a centralized `sanitizeCsvFormula` utility that prepends an apostrophe (`'`) to special formula characters.
2. Automated security tests verify that formula injections are neutralized in exported datasets.

## Consequences
Protects administrators opening exported spreadsheets from remote code execution or formula exfiltration.
