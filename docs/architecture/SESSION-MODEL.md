# Session Model & Token Lifecycle Specification

## 1. Hybrid Token-Session Model

Community OS utilizes a hybrid approach:

- **Stateless Tokens for Speed**: 15-minute JWT access tokens contain user claims and session IDs.
- **Server-Side Session Records for Control**: Every active login has a database record tracking the session status, device info, IP, last active timestamp, and hashed refresh token.

---

## 2. Session Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthAPI as Auth Controller & Service
    participant DB as PostgreSQL (user_sessions)
    participant Guard as Auth Guard

    Client->>AuthAPI: POST /api/v1/auth/login { email, password }
    AuthAPI->>DB: Validate credentials & create session
    AuthAPI-->>Client: Return { accessToken (JWT), refreshToken (raw), sessionId }

    Note over Client,Guard: Authenticated Request Flow
    Client->>Guard: GET /api/v1/organizations (Authorization: Bearer accessToken)
    Guard->>Guard: Verify JWT signature & expiration
    Guard->>DB: Check if session revoked or expired
    Guard-->>Client: Request proceeds / authorized

    Note over Client,AuthAPI: Token Refresh Flow
    Client->>AuthAPI: POST /api/v1/auth/refresh { refreshToken }
    AuthAPI->>DB: Match hashed refresh token & rotate
    AuthAPI-->>Client: Return new accessToken & new refreshToken
```
