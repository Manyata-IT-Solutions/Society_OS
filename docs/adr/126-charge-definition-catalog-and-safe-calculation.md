# ADR 126: Charge Definition Catalog and Safe Calculation Engine

## Context
Societies levy numerous charge types: area-based maintenance (₹/sqft), fixed amenity fees, per-parking charges, sinking funds, DG power, water consumption, and move-in fees. Arbitrary calculation formulas (e.g. JavaScript `eval`) create critical security vulnerabilities.

## Decision
We establish a declarative `ChargeDefinition` catalog paired with a safe, strictly typed `ChargeCalculatorService`. Supported calculation methods are:
- `FIXED_AMOUNT`
- `PER_SQFT` / `PER_SQM`
- `PER_UNIT`
- `PER_PARKING`
- `MANUAL`
- `SAFE_RULE_EXPRESSION` (evaluated via deterministic AST rules without arbitrary code execution).

All calculations use PostgreSQL `Decimal(18, 4)` precision and configurable rounding rules.

## Consequences
- Safe, formula-free execution eliminates injection vulnerabilities.
- Area adjustments and rates are authoritatively calculated on the backend.