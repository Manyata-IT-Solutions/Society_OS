# ADR 059: Hierarchical Ticket Category Catalog

## Context

Communities require structured categorization for issues to ensure accurate triage, routing to specialized technician teams, and proper SLA assignment. Additionally, sensitive categories (such as security incidents or neighbor disputes) require strict confidentiality.

## Decision

We implement a 2-tier hierarchical category catalog model:

1. **Parent-Child Hierarchy**: A top-level category (e.g. "Plumbing & Water") groups child subcategories (e.g. "Pipe Leakage", "Blocked Drain", "Low Pressure").
2. **Inheritance & Defaults**: Top-level categories define default priorities, default operational teams, default SLA policies, and unit requirements, which subcategories inherit unless explicitly overridden.
3. **Confidential / Sensitive Flag**: Categories marked `isSensitive: true` restrict ticket visibility to staff with `HELPDESK_VIEW_SENSITIVE` permission.

## Consequences

- **Positive**: Streamlines filing for residents while ensuring automatic triage routing and confidentiality.
- **Negative**: Requires tree traversal when rendering categories in management interfaces.
