# Community OS — Role-Based Experience Guide (Phase 25.5E)

This document describes how navigation, layout density, and landing screens adapt based on the authenticated operator's role.

---

## 1. Platform Super Admin (`admin@communityos.io`)
* **Default Landing**: `/app` (Root Platform Command Center).
* **Navigation Scope**: Complete unconstrained operational control plane (All 12 Domain Groups, System Settings, Organizations, Audit Trail).
* **Primary Tasks**: Cross-tenant monitoring, provisioning new township organizations, platform feature flags.

---

## 2. Community General Manager (`manager.gvh@northstar.demo`)
* **Default Landing**: `/app` (Community Executive Dashboard).
* **Navigation Scope**: Property master, residents, operations, helpdesk, facility, safety, governance, and analytics for the assigned township.
* **Primary Tasks**: Township operations, SLA risk oversight, committee meeting coordination, vendor escalations.

---

## 3. Finance Manager & Senior Accountant (`accountant.gvh@northstar.demo`)
* **Default Landing**: `/app/finance` (Financial Overview & Trial Balance).
* **Navigation Scope**: Financial Core ERP, Chart of Accounts, Journal Vouchers, Maintenance Billing Runs, Collections, AP, Bank Treasury, Budgets, and Financial Reports.
* **Primary Tasks**: Executing monthly billing runs, bank reconciliation, posting balanced double-entry vouchers, monitoring AR aging.

---

## 4. Facility Lead & Electrician/Technician (`tech.electric@northstar.demo`)
* **Default Landing**: `/app/facility/work-orders` (Technician Workstation).
* **Navigation Scope**: My Assigned Work, Work Orders, Asset Master, Preventive Maintenance, Inventory Spares, Meter Telemetry.
* **Primary Tasks**: Inspecting checklists, logging consumed spares, recording meter readings, signing off completed tasks.

---

## 5. Gate Security Guard (`guard.north@northstar.demo`)
* **Default Landing**: `/app/security/gate-app` (Guard Post Console).
* **Navigation Scope**: Guard Post Check-In Console, Visitor Passes, Active On-Premise Roster, Parking Bays, Emergency SOS Protocol.
* **Primary Tasks**: Rapid guest QR code verification, vehicle license plate lookup, manual entry logging, dispatching SOS assistance.

---

## 6. Resident Owner & Tenant (`resident.owner@demo.local`)
* **Default Landing**: `/app/communities` (Resident Portal Home).
* **Navigation Scope**: Simplified 9-item resident navigation: My Community & Unit, Maintenance Invoices & UPI Pay, Service Complaints, Guest Passes, Club Amenities, Society Notices, Documents, Utility Usage.
* **Primary Tasks**: Paying monthly dues, pre-approving guest passes, reserving the clubhouse, tracking complaint progress.
