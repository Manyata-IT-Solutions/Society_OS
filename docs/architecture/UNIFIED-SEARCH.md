# Unified Enterprise Global Search

## Architecture
- Search index projections across 24 operational domains (Tickets, Invoices, Assets, Policies, Units, Permits).
- Deterministic scoring: Exact Code Match (100) > Title Exact (80) > Keyword (60) > Text Partial (40).
- Strict RBAC security filtering before returning search hits.
