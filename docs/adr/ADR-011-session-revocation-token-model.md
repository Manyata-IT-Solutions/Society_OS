# ADR-011: Server-Side Revocable Session Model with Refresh Token Rotation

## Status

Accepted

## Context

Purely stateless JWT tokens cannot be revoked prior to their natural expiration, creating significant risk during credential compromises or employee offboarding. Conversely, purely stateful session tokens create database bottlenecks.

## Decision

Adopt a hybrid approach:

1. Short-lived (15 minutes) JWT Access Tokens containing a `sessionId` claim.
2. Server-side `user_sessions` records in PostgreSQL storing SHA-256 hashes of single-use Refresh Tokens.
3. Every call to `/refresh` rotates the refresh token, revoking the previous token hash immediately.
4. `AuthGuard` queries the session status against PostgreSQL to enforce instantaneous revocation when sessions are deleted.

## Consequences

- **Positive**: Immediate revocation capability, multi-device management, protection against refresh token replay.
- **Negative**: Requires session lookup on authenticated requests (optimized with indexed queries and ready for Redis caching layer).
