# ADR 051: Multi-Step Approval Engine, Maker-Checker, and Quorum Modes

## Context

Enterprise operations require flexible approval policies with multi-stage sign-offs, role-based delegation, quorum consensus modes, and protection against fraud or conflict of interest.

## Decision

We implement a dedicated, decoupled Approval Engine:

1. **Approval Step Pipelines**: Sequential steps configured with approver targets (`ROLE`, `PERMISSION`, `SPECIFIC_USER`, `RESOURCE_RELATION`).
2. **Eligible Approver Snapshotting**: When an approval step is activated, the eligible approver user IDs within the tenant scope are evaluated and snapshotted into `eligibleApproverIds`.
3. **Quorum Consensus Modes**:
   - `ANY_ONE`: First affirmative decision satisfies the step.
   - `ALL`: Every eligible approver in the snapshot must approve.
   - `MIN_COUNT`: Configurable minimum number of approvals required (e.g. 2 of 5).
4. **Rejection Behaviors**: Policy defines behavior upon rejection (`TERMINATE_WORKFLOW`, `RETURN_TO_PREVIOUS_STATE`, `RETURN_TO_REQUESTER`, `CUSTOM_TARGET_STATE`).

## Consequences

- **Positive**: Strict segregation of duties, robust quorum handling, and reusable approval chains across arbitrary business modules.
- **Negative**: Dynamic approver group alterations mid-step require explicit admin escalation.
