# ADR 076: Opaque QR and Barcode Identification Architecture

## Status

Accepted

## Context

Physical assets in residential and commercial communities require on-site identification via printed QR code badges and barcodes.
Encoding internal database IDs, tenant UUIDs, direct URLs with query params, or equipment secrets into QR codes creates severe security vulnerabilities, data leakage, and breaks when domains or backend routing structures change.

## Decision

We enforce an opaque token architecture for all physical asset identifiers:

1. **Opaque Random Tokens**: Every asset is allocated a cryptographically random, opaque QR token (`ast_qr_<hex>`) and an optional alphanumeric barcode identifier (`BC-AST-<seq>`).
2. **Zero Encoded Payload**: The QR code encodes only the opaque token string (or deep link `https://app.communityos.io/scan?t=ast_qr_...`). No tenant ID, serial number, or internal database primary key is embedded.
3. **Authenticated API Resolution**: Resolving a QR token requires calling the authenticated, scope-checked endpoint `GET /api/v1/asset-identifiers/qr/:token`. The server resolves the token against tenant boundaries, enforcing RBAC before returning asset passport details.
4. **Offline Resilience**: Barcode identifiers provide a human-readable fallback for manual entry on handheld scanners when camera scanning is degraded.

## Consequences

- Physical badges remain valid forever, even across URL refactors or tenant renames.
- Prevents unauthorized scanning or data scraping by unauthorized persons.
- Fully supports mobile technician scanner workflows.
