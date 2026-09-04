# Analytics Security & Multi-Tenant Isolation

## Controls
- Server-side scope enforcement: Queries strictly bound to RequestContext Organization & Community IDs.
- Cache key hashing includes tenant ID, role hash, and freshness timestamps.
