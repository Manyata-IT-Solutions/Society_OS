# ADR 018: Enterprise Security, Gate & Visitor Management Architecture

## Status
Accepted

## Context
Community OS requires an enterprise-grade physical security, gate operations, and visitor access control subsystem for residential societies, large campuses, and multi-society portfolios.

## Core Architectural Invariants
1. **Separation of Domains**:
   - **SECURITY DOMAIN OWNS PHYSICAL ACCESS EVENTS** (`SecurityGate`, `GateAccessEvent`, `Visit`, `AccessPass`, `ActiveVisit`, `WatchlistEntry`).
   - **RESIDENT DOMAIN OWNS OCCUPANCY & HOST AUTHORIZATION** (`Resident`, `Household`, `UnitAccessResolver`).
   - **VENDOR & PROJECT DOMAINS OWN CONTRACTOR CONTEXT** (`Vendor`, `ProjectWorkPackage`).
   - **FUTURE PARKING DOMAIN OWNS PARKING ALLOCATION** (Phase 19).
   - **EMERGENCY DOMAIN OWNS INCIDENT COMMAND** (Phase 24).
   - **NO FACIAL RECOGNITION, BIOMETRIC PROFILING, OR CONTINUOUS CCTV SURVEILLANCE** in Phase 18.

2. **Credential Privacy & Security**:
   - QR Pass contains only a cryptographically secure random token hash — **ZERO PII, no phone number, no unit number in QR payload**.
   - OTP passes are cryptographically random, hashed at rest, with strict attempt limits, rate limiting, and never logged in plaintext or event payloads.

3. **Centralized Server-Side Access Decision**:
   - `SecurityAccessDecisionService` evaluates gate eligibility, host validity, time windows, single-entry limits, watchlists, and produces authoritative decisions (`ALLOW`, `DENY`, `REQUIRE_HOST_APPROVAL`, `REQUIRE_SUPERVISOR_OVERRIDE`, `BLOCKED`). Frontend never decides access.

4. **Single-Entry Concurrency & Atomic Locking**:
   - Same QR scanned simultaneously at multiple gates allows exactly one entry; atomic locks prevent replay or concurrent duplication.

5. **Append-Only Gate Access Events & Active Projection**:
   - Physical entries and exits produce immutable `GateAccessEvent` records. Current occupancy is maintained in a fast, rebuildable `ActiveVisit` projection.

6. **Tenancy Lifecycle Integration**:
   - When a tenant moves out or loses active occupancy in Phase 4, associated future recurring visitor authorizations are automatically invalidated.
