# ADR 080: Monotonic Asset Meter Telemetry and Delta Tracking

## Status

Accepted

## Context

Preventive maintenance and warranty validation depend on cumulative meter telemetry (e.g., engine run hours, energy consumption in kWh, operating cycles).
Manual entry errors or malicious tampering can introduce regressions or negative deltas that invalidate maintenance triggers.

## Decision

1. **Append-Only Readings Log**: Meter readings are logged in `AssetMeterReading` with previous value, new reading, calculated positive delta, source (`MANUAL`, `WORK_ORDER`, `IOT`), and recording actor.
2. **Monotonic Validation**: Unless explicitly flagged with `isReset: true` on meters where `allowsReset: true` is configured, new readings must be strictly greater than or equal to the current meter reading.
3. **Atomic Current Value Cache**: The parent `AssetMeter.currentReading` is atomically updated in the same transaction as the reading record.

## Consequences

- Guaranteed mathematical consistency of cumulative equipment runtime.
- Accurate usage-based preventive maintenance scheduling.
