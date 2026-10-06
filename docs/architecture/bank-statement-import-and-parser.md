# Bank Statement Import and Parser

## Deduplication Fingerprint
- Deterministic cryptographic fingerprint: `SHA-256(bankAccountId + date + amount + direction + reference + description)`.
- Prevents duplicate transaction records across repeated or overlapping statement uploads.
