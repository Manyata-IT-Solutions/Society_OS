# ADR 050: Recursive AST Rules Engine and Fact Resolution

## Context

Policy guards and business eligibility rules require dynamic evaluation (e.g. `amount <= 50000 AND priority != 'CRITICAL'`). Embedding ad-hoc procedural if-else code leads to hard-coded customer logic, while dynamic code evaluation (`eval()`) creates remote code execution risks.

## Decision

We implement a safe, declarative Abstract Syntax Tree (AST) Rules Engine:

1. **Bounded Condition AST**: Conditions are expressed as JSON AST trees consisting of simple comparisons (`field`, `operator`, `value`) and boolean aggregators (`and`, `or`, `not`).
2. **Safe Evaluator**: Evaluates trees recursively with strict depth protection (maximum 10 levels) and node count limits (maximum 50 nodes), rejecting infinite recursion or stack overflows.
3. **Fact Registry**: Whitelisted fact paths (`resource.*`, `actor.*`, `workflow.*`) are injected into the evaluation context along with explicit timestamps.
4. **Dry-Run Simulation**: Privileged users can simulate rule outcomes against arbitrary fact payloads without mutating system state.

## Consequences

- **Positive**: Complete isolation from arbitrary code execution, deterministic evaluation, and transparent audit traces.
- **Negative**: Dynamic user scripts are not supported by design; complex calculations must be structured through fact providers.
