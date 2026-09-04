# Authentication Architecture & Security Specification

## 1. Overview

Community OS implements an enterprise-grade hybrid authentication mechanism combining:

1. **Stateless Short-Lived Access Tokens (JWT)**: Used for high-throughput, low-latency API authorization checks (15-minute TTL).
2. **Stateful Server-Side Refresh Tokens & Sessions**: Managed in PostgreSQL (`user_sessions` table) to support instantaneous revocation, multi-device management, and refresh token rotation.

---

## 2. Password Hashing & Credentials Storage

- **Algorithm**: `bcrypt` with salt rounds = 12.
- **Rules**:
  - Passwords are never logged or returned in any API responses.
  - Constant-time comparison is enforced during credential verification to eliminate timing side-channel attacks.
  - Accounts with status other than `ACTIVE` (e.g. `SUSPENDED`, `LOCKED`, `ARCHIVED`) are rejected before password comparison is completed.

---

## 3. JWT Access Token Structure

Access tokens are signed using `JWT_ACCESS_SECRET` with the following strict payload schema:

```json
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@communityos.io",
  "displayName": "Platform Admin",
  "isPlatformAdmin": true,
  "sessionId": "456e7890-e89b-12d3-a456-426614174001",
  "organizationId": "789e0123-e89b-12d3-a456-426614174002",
  "communityId": "012e3456-e89b-12d3-a456-426614174003",
  "iat": 1788290000,
  "exp": 1788290900,
  "iss": "community-os-api",
  "aud": "community-os-app"
}
```

---

## 4. Refresh Token Rotation & Session Revocation

- **Storage**: The raw refresh token is returned to the client once upon creation or rotation. The database only stores the SHA-256 hash of the token (`refresh_token_hash`).
- **Rotation**: Every time `/api/v1/auth/refresh` is called:
  1. The incoming refresh token is hashed and verified against the database session.
  2. If the session is valid, expired, or revoked, access is denied.
  3. A new cryptographically secure random token (40 bytes hex) is generated and its hash is updated in the session.
  4. The old refresh token is immediately invalidated.
- **Revocation**:
  - Individual session revocation: Sets `revoked_at = NOW()` on the target session. Subsequent API requests with access tokens bearing this `sessionId` are rejected immediately with `401 SESSION_REVOKED`.
  - Global logout (`logout-all`): Sets `revoked_at = NOW()` for all active sessions of that user.
