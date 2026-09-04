# COMMUNITY OS — PRODUCTION SECURITY CHECKLIST

---

## 1. Must Before Production (Blockers)
- [x] **Zero Development Secrets**: Production environment variables must contain cryptographically secure, unique secrets.
- [x] **Demo Seed Blocking**: `pnpm demo:seed` and `pnpm demo:reset` must be disabled when `NODE_ENV=production`.
- [x] **Strict CORS**: Replace wildcard origins with explicit domain whitelist (`https://admin.communityos.io`).
- [x] **Secure Cookies**: Enable `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/` for session cookies.
- [x] **TLS Encryption**: Enforce HTTPS in transit via reverse proxy / load balancer with HSTS.
- [x] **Immutable Financial Posting**: Verified that posted general ledger entries cannot be updated or deleted.
- [x] **Gate Pass Concurrency**: Verified that single-use QR passes cannot be double-consumed.

---

## 2. Recommended Operational Hardening
- [x] **Rate Limiting**: Distributed Redis rate limiting on authentication and expensive reporting/AI endpoints.
- [x] **Logging Redaction**: Ensure passwords, tokens, bank details, and personal identifiers are redacted from logs.
- [x] **CSV Formula Defense**: Tabular data exports sanitized to prevent spreadsheet formula injection.
- [x] **AI Prompt Delimiters**: AI prompt inputs sanitized against prompt injection and cross-tenant queries.
- [x] **Automated Security Regression**: Security test suite running in continuous integration.

---

## 3. Infrastructure & Deployment Controls
- [ ] Managed PostgreSQL with encrypted storage at rest (AES-256) and daily point-in-time recovery.
- [ ] Network firewall restricting PostgreSQL, Redis, and internal storage access to application nodes only.
- [ ] Web Application Firewall (WAF) or Cloudflare DDoS protection on public ingress.
