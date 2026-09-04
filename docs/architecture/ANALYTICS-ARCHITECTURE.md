# Enterprise Analytics Architecture

## Bounded Contexts
- **Semantic Metric Layer**: Centralized metric catalog, formula resolution, and target tracking.
- **Analytics Query Engine**: AST-based DSL execution against operational records and precomputed summaries.
- **Executive & Portfolio Command Centers**: Normalized comparisons across estates (per-unit and occupancy ratios).
- **Report Engine & Scheduler**: Governed report builder with automated recurring snapshots.
- **Data Quality & Lineage**: End-to-end entity lineage and discrepancy auditing.
