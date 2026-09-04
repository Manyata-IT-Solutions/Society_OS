# ADR 061: Resident Experience and Privacy Boundary

## Context

Residents filing complaints must receive timely updates and transparent progress tracking without exposing internal staff conversations, vendor costs, or sensitive operational notes.

## Decision

We enforce a strict privacy boundary between staff and resident experiences:

1. **Comment Separation**: Comments are typed as either `PUBLIC_REPLY` or `INTERNAL_NOTE`. Resident API endpoints and resident queries unconditionally filter out `INTERNAL_NOTE` entries.
2. **Scoped Authorization**: Residents can only access tickets associated with their occupied units, active household memberships, or tickets they personally created.
3. **Public Activity Timeline**: Residents view a curated timeline of milestones (Filed, Dispatched, In Progress, Resolved) and public replies.

## Consequences

- **Positive**: Total privacy protection for staff internal notes while maintaining a responsive resident portal.
- **Negative**: Repository queries must apply privacy filters based on actor role.
