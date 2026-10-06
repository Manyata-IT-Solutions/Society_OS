# ADR 024: Enterprise Emergency, Incident, Safety, Risk & Compliance Architecture

## Status
Accepted

## Context
Community OS requires enterprise orchestration for emergency distress alerts (SOS), multi-type incident command and containment, evacuation workflows, muster accountability, safety hazard registers, 5x5 risk matrices, inspection checklists, fire/evacuation drill simulations, statutory compliance obligations, licenses/certificates, insurance readiness, and command center coordination.

## Decision Invariants
1. **SOS ≠ INCIDENT**: An SOS is an initial distress signal; multiple SOS events can correlate into one authoritative Incident.
2. **INCIDENT ≠ WORK ORDER**: Containment and immediate response are Incident Actions; post-stabilization repairs generate Phase 9 Work Orders.
3. **INCIDENT ≠ SECURITY EVENT / UTILITY OUTAGE**: Source events remain authoritative in their domains (Phase 18 Gate, Phase 23 Outage) and are linked without mutation.
4. **HAZARD ≠ INCIDENT**: Hazards represent potential harm/unsafe conditions; Incidents represent realized events.
5. **FINDING ≠ CORRECTIVE ACTION (CAPA)**: Inspection findings document gaps; CAPA tracks remediation with independent verification.
6. **COMPLIANCE REQUIREMENT ≠ CREDENTIAL**: Requirements describe statutory obligations; Credentials (Licenses, NOCs) are issued evidence documents.
7. **DRILL ≠ REAL INCIDENT**: Drills are simulated exercises marked explicitly without corrupting historical safety metrics.
8. **JURISDICTION CONFIGURABLE**: The engine is evidence-driven with configurable rules, avoiding hardcoded statutory laws.
