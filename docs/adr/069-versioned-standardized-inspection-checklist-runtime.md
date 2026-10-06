# ADR 069: Versioned Standardized Inspection Checklist Runtime

## Status

Accepted

## Context

Facility operations require standardized inspection steps (e.g. generator battery voltage, elevator brake test, HVAC refrigerant pressure). Over time, inspection standards evolve and checklist templates are updated. Modifying an active template must not retroactively mutate past work orders or completed audit records.

## Decision

1. **Template Versioning**: `FacilityChecklistTemplate` is versioned (`code + version`). Published templates are immutable; editing a published template creates a new version.
2. **Work Order Snapshotting**: When a Work Order is created with a checklist template, the template items are snapshotted into `WorkOrderChecklistResult` rows referencing `checklistTemplateId` and `templateVersion`.
3. **Rich Item Types**: Supports `BOOLEAN`, `PASS_FAIL`, `NUMBER`, `DECIMAL`, `TEXT`, `SELECT`, and `PHOTO_REQUIRED`.
4. **Validation Enforcement**: Work completion is blocked if any required checklist item is unsubmitted or if required photos/comments are missing.

## Consequences

- Historical integrity of completed inspections is guaranteed.
- Strict quality gating before technicians can complete field tasks.
