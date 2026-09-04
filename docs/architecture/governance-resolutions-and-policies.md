# Governance Resolutions & Policy Lifecycle Register

## Overview
- **Resolution Register**: Long-term memory tracking adopted decisions, effective dates, and downstream domain links (CAPEX projects, budgets, vendor awards).
- **Policy Versioning**: Policies have immutable version records (`v1`, `v2`) with effective date ranges.
- **Policy Resolver**: `resolveEffectivePolicy(policyId, asOfDate)` returns the exact rule set active on any historical date.
