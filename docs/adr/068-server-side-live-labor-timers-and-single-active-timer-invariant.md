# ADR 068: Server-Side Live Labor Timers and Single-Active-Timer Invariant

## Status

Accepted

## Context

Accurate tracking of technician labor time is critical for operational cost accounting, productivity analysis, and contractor invoicing. Client-side timers are vulnerable to clock tampering, browser tab closures, and device reboots. Furthermore, a physical technician cannot be actively performing physical work on two different work orders simultaneously.

## Decision

1. **Server-Side Timestamps**: When a timer is started, the API records `startedAt: now()` server-side in `WorkLog` with `endedAt = null`. When stopped, the API calculates `durationMinutes = round((now() - startedAt) / 60000)`.
2. **Single Active Timer Invariant**: Before starting a timer, the service queries `findActiveWorkLog(userId)`. If an active running timer exists on any work order, the start request is rejected with a `409 Conflict` until the technician stops the existing timer.
3. **Completion Guard**: A work order cannot be submitted as completed while the technician has an active running timer on that work order.

## Consequences

- 100% reliable labor duration calculations independent of client state.
- Prevents double-billing or overlapping labor logs for individual technicians.
