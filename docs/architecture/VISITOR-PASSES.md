# Access Passes & Credential Security

## Opaque Cryptographic Tokens
- QR payload contains only an opaque random entropy token (e.g. `SEC-7F89B2...`).
- Tokens are SHA-256 hashed at rest; raw token is never stored in plain text.
- Over-the-air scans transmit the hash for server verification.
- Zero PII is encoded in the QR string.
