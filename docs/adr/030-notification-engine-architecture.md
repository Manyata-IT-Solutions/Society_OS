# ADR 030: Notification Engine Architecture

## Status

Accepted

## Context

Multiple modules (billing, visitors, amenities, security) require multi-channel communication with residents, staff, and external integrations.

## Decision

We implemented a centralized `NotificationEngine` supporting In-App, Email, SMS, Push, WhatsApp, and Webhook channels with safe variable interpolation, preference resolution hierarchy, deduplication keys, and exponential backoff retry workers.

## Consequences

### Positive

- Unified template management and delivery monitoring.
- Residents have granular channel preferences while critical security alerts remain mandatory.

### Negative

- Multi-provider delivery requires external webhook feedback loops for final delivery receipts.
