# ADR 049: Server-Side State Machine Action Resolution

## Context

Allowing client frontends to send raw state assignment payloads (e.g. `PATCH /instances/:id { "state": "APPROVED" }`) creates severe privilege escalation vulnerabilities and violates finite state machine invariants.

## Decision

All state transitions are action-oriented and resolved entirely server-side:

1. **Action-Driven Payloads**: Clients never submit target states; they submit authorized intent actions (`action = "submit"`, `action = "approve"`, `action = "reject"`).
2. **Deterministic Transition Lookup**: The server loads the instance's `currentState`, matches the transition graph for the submitted action from that current state, checks RBAC permissions, and resolves the target state.
3. **Allowed Actions Endpoint**: Clients query `GET /workflows/instances/:id/actions` to retrieve dynamically resolved allowed actions based on current state and user permissions.

## Consequences

- **Positive**: Strict encapsulation of state machine rules; clients cannot jump states or bypass transition guards.
- **Negative**: Client applications must be built around actions rather than direct state modification.
