# ADR 055: Maker-Checker and Self-Approval Prevention

## Context

In financial expenses, governance voting, architectural approvals, and high-impact actions, allowing the requester (Maker) to approve their own request (Checker) creates severe compliance vulnerabilities and fraud risks.

## Decision

We enforce strict Maker-Checker verification within the Approval Engine:

1. **Configurable Self-Approval Flag**: Each approval step in an approval policy explicitly specifies `allowSelfApproval: boolean` (default: `false`).
2. **Requester Identity Binding**: When an approval instance starts, the initiating user ID is recorded in `requesterId`.
3. **Execution-Time Verification**: When an actor attempts to submit a decision (`APPROVE` or `REJECT`) on a step where `allowSelfApproval === false`, the system verifies `requesterId !== actor.id`. If they match, the action is rejected with `403 Forbidden (APPROVAL_SELF_ACTION_DENIED)`.
4. **Duplicate Decision Prevention**: Actors are restricted from submitting multiple decisions on the same step (`stepInstanceId_actorId` uniqueness constraint).

## Consequences

- **Positive**: Strict financial and operational governance compliance with automated Maker-Checker enforcement.
- **Negative**: Test cases or single-user demonstration environments requiring self-approval must explicitly set `allowSelfApproval: true` on designated review policies.
