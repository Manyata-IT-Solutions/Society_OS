# ADR-0027: Revocable Session Lifecycle & Short-Lived JWT Architecture

## Status
Accepted

## Context
Stateless JWTs cannot be revoked instantly if a user's role or membership is terminated.

## Decision
1. Access tokens are short-lived (15 minutes) with minimal claims.
2. Every request performs a fast database session check against the `sessions` table to verify that `revokedAt` is null and `expiresAt > now()`.
3. Refresh tokens are rotating and stored as SHA-256 hashes.
4. Logging out or revoking a session takes effect immediately on all subsequent requests.

## Consequences
Combines the benefits of JWT authorization with instantaneous, server-controlled session revocation.
