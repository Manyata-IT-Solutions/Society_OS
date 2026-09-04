# ADR 090: Batch Tracking, FEFO Picking Strategy & Expiry Alerts

## Status

**ACCEPTED**

## Context

Consumables such as chemicals, sealants, paints, and lubricants have finite shelf lives. Issuing expired supplies can cause equipment failure or safety hazards.

## Decision

For items with isBatchTracked/isExpiryTracked: (1) Inward receipts capture batchNumber and expiryDate; (2) Store issue suggestions follow First-Expiry-First-Out (FEFO) picking order; (3) Expired batches are blocked from normal dispatch; (4) Background cron sweepers emit inventory.batch_expiring.v1 notifications at configurable threshold intervals (e.g. 30d, 7d).

## Consequences

Elimination of spoiled chemical usage, proactive restocking, automated compliance with safety standards.
