# ADR 034: Notification Preference Hierarchy

## Status

Accepted

## Context

Residents should control their notification channels for general notices, but mandatory security notices and emergency alerts must never be suppressed.

## Decision

We established a strict 4-level evaluation hierarchy:

1. **Mandatory Security Policy** (Critical & Security categories are non-suppressible).
2. **Tenant Community Policy** (Property mandatory notices).
3. **Category System Defaults**.
4. **User Explicit Preferences**.

## Consequences

### Positive

- Prevents residents from missing critical access revocation or emergency alerts while honoring communication preferences for routine notices.
