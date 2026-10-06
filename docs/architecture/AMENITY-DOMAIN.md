# Enterprise Amenities Domain

## Overview
Phase 20 governs amenity master catalogs, bookable resources, operating schedules, slot duration rules, booking policies, dynamic availability, approval workflows, pricing & deposit calculations, waitlists, and damage settlements.

## Core Lifecycle
```
Amenity / Resource ──► Operating Schedule ──► Availability Engine ──► Reservation
                                                                           │
                                                                           ▼
                                                                  Eligibility & Quota
                                                                           │
                                                                           ▼
                                                                Price & Deposit Snapshot
                                                                           │
                                                                           ▼
                                                                   Booking Confirmed
                                                                           │
                                                                           ▼
                                                                   Gate Passes (P18)
                                                                  & Parking Bays (P19)
                                                                           │
                                                                           ▼
                                                                    Check-In & Usage
                                                                           │
                                                                           ▼
                                                                   Deposit Settlement
```
