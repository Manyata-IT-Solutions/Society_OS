# ADR 019: Enterprise Parking & Vehicle Management Architecture

## Status
Accepted

## Context
Community OS requires an enterprise-grade physical parking inventory, vehicle registry, entitlement rights, slot allocations, visitor capacity pool, EV charging, and gatehouse integration subsystem.

## Core Architectural Invariants
1. **Separation of Domains**:
   - **SECURITY OWNS GATE ENTRY/EXIT** (Phase 18).
   - **PARKING OWNS VEHICLE REGISTRY, PARKING RIGHTS, SLOT INVENTORY & OCCUPANCY** (Phase 19).
   - **BILLING OWNS MONETARY CHARGES** (Phase 14).
   - **ASSET DOMAIN OWNS PHYSICAL CHARGERS/BARRIERS WHERE MODELED** (Phase 10).
   - **ACCESS-CONTROL INTEGRATION REMAINS PROVIDER-AGNOSTIC**.
   - `Vehicle ≠ Parking Slot. Parking Slot ≠ Parking Right. Parking Right ≠ Parking Allocation. Vehicle Entry ≠ Parking Occupancy. Parking Occupancy ≠ Security Visit. Parking Penalty ≠ Finance Journal. EV Charger ≠ Parking Slot.`

2. **Canonical Vehicle Model & Vehicle Authorization**:
   - Unified `Vehicle` master linked with `VehicleAuthorization` (`OWNER`, `FAMILY`, `LEASED`, `COMPANY`, `AUTHORIZED_USER`, `TEMPORARY`) to `Household` / `Unit` / `Resident`.
   - Document Core links for RC, Insurance, and Lease verifications.

3. **Entitlement vs Physical Allocation vs Occupancy**:
   - **Parking Right**: Entitlement assigned to a Unit (e.g. 2 car slots).
   - **Parking Slot**: Physical inventory in a `ParkingArea` / `ParkingZone`.
   - **Parking Allocation**: Active assignment of a compatible slot to a parking right.
   - **Parking Occupancy**: Real-time physical occupancy recorded at gate entry/exit.

4. **Concurrency & Double Allocation Protection**:
   - Atomic database locking guarantees two residents can never be allocated the same exclusive physical slot concurrently.
   - Visitor parking pool capacity is strictly bounded.

5. **Move-Out Invalidation**:
   - When a household moves out or loses active tenancy in Phase 4, associated vehicle authorizations, parking allocations, and access permits are automatically invalidated.

6. **Billing & Accounting Separation**:
   - Parking domain never writes directly to General Ledger; approved penalties and slot rentals emit requests through Phase 14 Billing services.
