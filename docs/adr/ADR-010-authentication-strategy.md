# ADR-010: Authentication Strategy & Credential Hashing

## Status

Accepted

## Context

Community OS requires an enterprise-grade authentication mechanism supporting both centralized platform administration and multi-tenant organization users. Passwords must be hashed using industry standards with high work factor, and credentials must be validated securely without leaking timing information.

## Decision

1. **Password Hashing**: Adopt `bcrypt` with a cost factor of 12 for password storage.
2. **Credential Validation**: Enforce constant-time comparisons and reject inactive accounts (`SUSPENDED`, `LOCKED`, `ARCHIVED`) prior to password verification.
3. **No Credential Leakage**: Never expose password hashes or credential tokens in API payloads or audit logs.

## Consequences

- **Positive**: Resilient against brute-force and dictionary attacks.
- **Negative**: Higher CPU cost during login operations (mitigated by asynchronous hashing workers and rate limiting).
