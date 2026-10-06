# ADR-006: API Conventions, Envelopes & Versioning Strategy

## Status

Accepted

## Context

Community OS must provide consistent, predictable, and secure REST APIs for web consoles, mobile applications, IoT security gates, and third-party facility integrations. We need a standardized API style for routing, response wrapping, error formatting, and pagination.

## Decision

We adopt **RESTful API Conventions with URI Versioning and Standard Envelopes**:

1. **Versioning**: All endpoints are prefixed with `/api/v1/...`.
2. **Success Envelope**:
   ```json
   {
     "data": {},
     "meta": {
       "timestamp": "2026-09-01T23:00:00.000Z",
       "pagination": { "page": 1, "limit": 20, "totalItems": 100, "totalPages": 5 }
     },
     "requestId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```
3. **Error Envelope**:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Validation failed",
       "details": [{ "field": "email", "message": "Invalid email address" }]
     },
     "requestId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```
4. **Pagination Strategy**:
   - Offset pagination (`page`, `limit`) for administrative grid views.
   - Cursor pagination (`cursor`, `limit`) for high-frequency logs, visitor scans, and activity feeds.
5. **OpenAPI / Swagger**: Auto-generated documentation at `/api/docs`.

## Alternatives Considered

- **GraphQL**: Considered for mobile clients, but REST + OpenAPI offers better caching, simpler HTTP-level rate limiting, simpler file upload management, and easier enterprise integration for Phase 0. GraphQL can be added later as an API adapter layer if needed.
- **gRPC**: Overkill for web frontend clients in early phases; reserved for high-throughput internal IoT device gateways in future phases.

## Consequences

- **Positive**: High predictability for client developers; machine-readable error codes; standardized correlation and tracing.
- **Negative**: Adds a small serialization layer to NestJS responses (handled automatically by `TransformInterceptor`).
