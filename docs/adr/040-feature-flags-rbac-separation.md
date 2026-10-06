# ADR 040: Feature Flags Architecture & RBAC Independence

## Status

Accepted

## Context

Platform capabilities and modules must be toggleable per tenant or community tier without conflating system capability state with user identity authorizations.

## Decision

We decouple Feature Flags from Role-Based Access Control (RBAC):

1. **Feature Flags**: Control whether a capability is enabled for a given platform, organization, or community tier.
2. **RBAC**: Controls whether an authenticated user possesses the scoped permission to perform an action.
3. Access to any protected capability strictly requires BOTH `Feature is enabled` AND `User is authorized`.

Feature flag overrides follow the same hierarchical resolution as the Configuration Engine (`Community -> Organization -> Platform Default`).

## Consequences

### Positive

- Clear separation of concerns between commercial entitlements / operational toggles and user security.
- Eliminates hardcoded `if (communityId === ...)` conditionals in business logic.
- Safe client capability discovery via sanitized `isClientSafe` flags.

### Negative

- Requests for disabled features require two layers of checks (feature toggle check and permission guard check).
