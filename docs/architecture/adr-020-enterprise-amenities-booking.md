# ADR 020: Enterprise Amenities, Facilities & Booking Management Architecture

## Status
Accepted

## Context
Community OS requires an enterprise-grade amenity inventory, resource scheduling, slot policy, availability engine, multi-resource and capacity-based booking, approval workflow, pricing & deposit snapshotting, cancellation/refunds, waitlist promotion, guest access (Phase 18) & parking (Phase 19) integration, and maintenance block (Phase 9/17) subsystem.

## Core Architectural Invariants
1. **Separation of Domains**:
   - **AMENITY DOMAIN OWNS AVAILABILITY AND RESERVATIONS**.
   - **BILLING OWNS RESIDENT FINANCIAL CHARGES** (Phase 14).
   - **SECURITY OWNS PHYSICAL GATE ACCESS** (Phase 18).
   - **PARKING OWNS PARKING CAPACITY/RESERVATIONS** (Phase 19).
   - **FACILITY MANAGEMENT OWNS MAINTENANCE WORK** (Phase 9).
   - **ASSET DOMAIN OWNS PHYSICAL EQUIPMENT** (Phase 10).
   - `Amenity ≠ Resource. Resource ≠ Asset. Availability ≠ Booking. Reservation ≠ Payment. Reservation ≠ Security Access Pass. Reservation ≠ Visitor Invitation. Booking Charge ≠ Resident Ledger Entry. Maintenance Block ≠ WorkOrder.`

2. **Exclusive vs Capacity Booking**:
   - Exclusive resources (e.g. Badminton Court, Party Hall) guarantee single-party exclusive occupancy per slot.
   - Capacity resources (e.g. Swimming Pool max 50, Gym max 30) track participant quotas atomically without overbooking.

3. **Dynamic Availability Engine**:
   - Evaluates weekly operating schedules, special holiday schedules, turnaround buffers, active bookings, temporary holds, and maintenance blocks.

4. **Pricing, Deposits & Financial Safety**:
   - Snapshotting of rates, taxes, and cancellation policies at booking confirmation.
   - Idempotent charge/refund requests emitted to Phase 14 Billing without direct General Ledger manipulation.

5. **Security & Parking Integration**:
   - Confirmed event bookings generate Phase 18 `VisitorInvitation` and `AccessPass` records.
   - Integrated with Phase 19 `ParkingReservationPort` for visitor parking bay allocations.
