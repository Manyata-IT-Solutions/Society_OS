# Session Management & Token Revocation Architecture

## 1. Overview

Community OS provides robust, server-controlled session lifecycles for both Web and Mobile interfaces.

---

## 2. Session Entity Schema

```prisma
model UserSession {
  id               String    @id @default(uuid()) @db.Uuid
  userId           String    @map("user_id") @db.Uuid
  refreshTokenHash String    @map("refresh_token_hash") @db.VarChar(255)
  userAgent        String?   @map("user_agent") @db.VarChar(255)
  ipAddress        String?   @map("ip_address") @db.VarChar(45)
  lastActiveAt     DateTime  @default(now()) @map("last_active_at") @db.Timestamptz(6)
  expiresAt        DateTime  @map("expires_at") @db.Timestamptz(6)
  revokedAt        DateTime? @map("revoked_at") @db.Timestamptz(6)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshTokenHash])
  @@index([expiresAt])
  @@map("user_sessions")
}
```

---

## 3. Session Operations

### 1. Creation on Login

Upon successful credential validation at `POST /api/v1/auth/login`:

- A server-side `UserSession` is created with a 30-day expiration window.
- The client receives an Access Token (15m JWT containing `sessionId`) and a Refresh Token (random 40-byte hex).

### 2. Live Revocation Check

On every authenticated request, `AuthGuard` queries the session table by `payload.sessionId`.
If `session.revokedAt != null` or `session.expiresAt <= now()`, the request is immediately rejected with `401 SESSION_REVOKED`.

### 3. Session Revocation APIs

- `DELETE /api/v1/auth/sessions/:sessionId`: Users can view their active sessions (with device/browser info and last active time) and revoke any individual session.
- `POST /api/v1/auth/logout-all`: Revokes all active sessions for that user across all devices.
