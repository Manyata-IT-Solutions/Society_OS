# ADR 037: Notification Channel Providers

## Status

Accepted

## Context

Multi-channel notifications require clean provider abstractions so delivery providers (SendGrid, Twilio, Firebase, etc.) can be swapped without modifying business logic.

## Decision

We established provider interfaces (`EmailProvider`, `SmsProvider`, `PushProvider`) with development fallback log-sinks (`LogSinkEmailProvider`, `LogSinkSmsProvider`, `LogSinkPushProvider`).

## Consequences

### Positive

- Fully testable offline development without external API keys.
- Straightforward cloud provider integrations.
