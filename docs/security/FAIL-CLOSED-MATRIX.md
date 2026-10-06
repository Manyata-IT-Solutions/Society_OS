# COMMUNITY OS — FAIL-CLOSED SECURITY MATRIX

**System Decision Policies for Component Failures & Boundary Errors**

---

| Subsystem / Operation | Failure / Error Scenario | System Behavior (Fail-Closed) | User / API Impact |
| :--- | :--- | :--- | :--- |
| **Authentication** | Session database query times out or returns error. | **DENY ACCESS (401)** | User is prompted to re-authenticate. No bypass tokens. |
| **Authorization / RBAC** | `evaluateScopedPermission` encounters missing role or unknown permission. | **DENY ACCESS (403)** | Request rejected with `TENANT_ACCESS_DENIED`. |
| **Tenant Context** | Request provides invalid, unmapped, or unauthorized `x-organization-id`. | **REJECT (403/404)** | Cross-tenant access is completely blocked. |
| **Financial Posting** | Fiscal period closed or journal lines unbalanced (Debit != Credit). | **ABORT TRANSACTION (400)** | Journal remains in Draft/Submitted; no partial ledger post. |
| **Gate Security** | Pass validation decision is ambiguous or credential hash mismatch. | **DENY ENTRY (400)** | Gate barrier remains closed; security alert logged. |
| **Payment Webhooks** | Signature mismatch or invalid event payload. | **REJECT (400/401)** | Payment status is NOT updated to SUCCESS; webhook rejected. |
| **Document Streaming** | User lacks required classification permission for requested file. | **DENY STREAM (403)** | No byte stream or metadata returned to unauthorized caller. |
| **Analytics & AI Engine** | AI provider failure or prompt policy violation detected. | **SAFE ERROR (400/503)** | Core ERP unaffected; AI response aborted with security notice. |
