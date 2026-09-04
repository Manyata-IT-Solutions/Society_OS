# ADR 038: CSV Formula Injection Mitigation

## Status

Accepted

## Context

Exported CSV files containing user-supplied input (e.g. audit metadata, resident names) could contain spreadsheet formulas (`=`, `+`, `-`, `@`) that execute arbitrary commands when opened in Microsoft Excel or LibreOffice Calc.

## Decision

All CSV export functions (`AuditService.exportAuditCsv`, `ResidentImportExportService`, etc.) sanitize cell values starting with `=,+,-,@` by prepending a single quote `'` and properly escaping embedded quotes.

## Consequences

### Positive

- Total protection against CSV injection / formula injection attacks.
