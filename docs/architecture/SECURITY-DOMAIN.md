# Enterprise Security & Gate Management Domain

## Overview
Phase 18 governs physical security, vehicle access, visitor pre-approvals, delivery partner drop-offs, trade contractor access, and gatehouse terminal workflows.

## Architecture & Lifecycles
```
Resident Pre-Approval
  │
  ▼
Opaque Cryptographic Pass (QR / OTP)
  │
  ▼
Gate Arrival (Scan / Input)
  │
  ▼
SecurityAccessDecisionService (Evaluates Gate, Host, Watchlist, Pass)
  │
  ▼
Atomic Check-In Command ──► Immutable GateAccessEvent
  │
  ▼
ActiveVisit Projection Updated
  │
  ▼
Gate Departure / Exit ──► ActiveVisit Deleted
```
