# ADR 021: Enterprise Staff, Workforce & Shift Management Architecture

## Status
Accepted

## Context
Community OS operational workflows across residential and commercial estates require human labor execution for security guarding, plant operations (DG, STP, WTP, substations), electrical and plumbing maintenance, amenity supervision, and housekeeping. Prior phases established IAM User identity (Phase 2), Vendor supplier identity (Phase 12), and Work Orders (Phase 9). A dedicated workforce engine is required to model workers independently from user accounts, support direct vs vendor contract labor, schedule recurring and cross-midnight shifts, calculate real-time shift coverage, record append-only attendance evidence, verify skill certifications, and deploy guards and technicians without creating payroll or invasive surveillance engines.

## Decision Drivers & Core Invariants
1. **Worker Identity Decoupling**: `IAM USER ≠ WORKER`. Workers are operational individuals who may or may not possess Community OS user logins. Worker identity is mastered in `Worker`, not `User`.
2. **Direct vs Contract Worker Modeling**: Direct employees are engaged directly by the organization; contract workers are supplied by a Phase 12 Vendor under vendor engagement contracts.
3. **Cross-Midnight Shifts**: Shifts spanning midnight (e.g. 22:00 to 06:00) are native first-class citizens where `crossesMidnight: true` correctly calculates duration across days.
4. **Append-Only Attendance**: Raw attendance events (`CHECK_IN`, `CHECK_OUT`, `MANUAL_CORRECTION`) are immutable logs linked to logical `AttendanceSession`. Corrections never delete raw evidence.
5. **Capability Matching for WorkOrders**: Technicians are matched based on required trades, verified skill levels, active engagement status, and valid unexpired licenses. Expired certifications prevent assignment.
6. **Privacy & Biometric Guardrails**: Biometric templates (fingerprint, face, iris) are never stored in Community OS. Hardware terminals transmit only device event references, worker IDs, and timestamps. Continuous GPS tracking is forbidden.
7. **No Full Payroll Engine**: Phase 21 does not implement statutory labor compliance, PF/ESI computation, or salary disbursement, leaving these to external ERP integrations.

## Architecture
- **Workforce Master**: `Worker` model linked to optional `User` and `Document` (photo, IDs).
- **Structure & Competencies**: `WorkforceDepartment`, `WorkforceJobRole`, `WorkforceSkill`, `WorkerSkill`, `WorkerCertification`.
- **Shift & Roster Engine**: `ShiftTemplate`, `ShiftInstance`, `WorkforceRoster`, `ShiftAssignment`, `ShiftSwapRequest`, `StaffingRequirement`.
- **Attendance & Corrections**: `AttendanceSession`, `AttendanceEvent`, `AttendanceCorrectionRequest`, `LeaveRequest`, `OvertimeRecord`.
- **Operational Deployments & Tasks**: `WorkforceDeployment`, `WorkforceTask`, `WorkforceTimesheet`, `AttendanceDevice`.

## Consequences
- **Positive**: Clean separation of IAM security accounts and operational staff; auditable attendance and shift coverage; zero privacy violations from biometric storage.
- **Negative**: Requires synchronization when a worker transitions into a platform administrator role.
