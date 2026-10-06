# COMMUNITY OS — FRONTEND PERFORMANCE & BUNDLE REPORT

---

## 1. Next.js Admin Web Bundle Metrics

| Route / Chunk | Page Type | Bundle Size | First Load JS | Optimization Applied |
| :--- | :---: | :---: | :---: | :--- |
| `/login` | Static | 3.21 kB | 111 kB | Minimal client runtime |
| `/app/dashboard` | Dynamic | 3.27 kB | 111 kB | Parallel KPI fetching |
| `/app/units` | Static / SSR | 3.84 kB | 103 kB | Server-side pagination (20/page) |
| `/app/finance` | Dynamic | 2.53 kB | 111 kB | Server-side balance summaries |
| `/app/security/gate-app` | Static | 2.36 kB | 102 kB | Instant scanner input handler |
| **Shared Base Chunks** | Shared | 87.4 kB | 87.4 kB | Tree-shaken Lucide icons & Tailwind |

---

## 2. Waterfall Elimination & Request Optimization
- **Parallel Data Fetching**: Unified dashboard views leverage `Promise.all()` rather than sequential waterfalls.
- **Bounded Table Rendering**: All enterprise tables enforce server-side pagination with fixed page sizes (10, 20, 50, 100), eliminating browser DOM bloat.
