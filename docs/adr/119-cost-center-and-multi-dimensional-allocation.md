# ADR 119: Cost Center and Multi-Dimensional Allocation

## Status
Accepted

## Context
Facility operations need departmental and asset-level cost visibility (e.g. Lift Maintenance vs DG Operations vs Security) without polluting the Chart of Accounts with duplicate expense accounts.

## Decision
Implement hierarchical `CostCenter` entities and bounded `FinancialDimension` keys. Expense and revenue journal lines can be tagged with cost center IDs. The posting engine enforces dimension requirements based on account configuration.

## Consequences
Enables clean operational cost tracking, budget-versus-actual analysis, and granular facility management reporting.
