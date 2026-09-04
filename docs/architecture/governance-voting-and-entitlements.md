# Governance Voting, Entitlements & Deterministic Counting

## Invariants
1. **Entitlement Registry**: Every eligible unit owner is issued a single `VoteEntitlement` record.
2. **Double-Vote Prevention**: Atomic transactions mark `isConsumed: true` upon ballot submission.
3. **Decimal Weights**: Unit-share or square-footage weights use database `Decimal` to avoid floating-point inaccuracies.
4. **Deterministic Counting**: Server-side tally evaluates simple majority or supermajority thresholds, producing immutable `resultSummary` snapshots.
