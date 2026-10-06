# ADR 064: Reopen Policies and Resolution Codes

## Context

Technicians may resolve tickets prematurely or an issue may recur shortly after repair. Properties require a formal mechanism for residents to reopen unsatisfactory resolutions while tracking reopen frequencies for quality control.

## Decision

We establish formal Reopen and Resolution Code governance:

1. **Structured Resolution Codes**: Resolving tickets requires a `resolutionCode` (`FIXED`, `NO_FAULT_FOUND`, `CANCELLED_BY_USER`, `WORKAROUND_APPLIED`, `REFERRED_TO_VENDOR`) and a mandatory resolution summary.
2. **Reopen State Machine**: Resolved or closed tickets can transition to `REOPENED`.
3. **Reopen Counter**: Each reopen event increments `reopenCount` and publishes `ticket.reopened.v1`, alerting team supervisors when tickets are repeatedly reopened.

## Consequences

- **Positive**: Accurate root-cause tracking and visibility into repeat complaint failures.
- **Negative**: Requires resolution codes to be standardized across communities.
