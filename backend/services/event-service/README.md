# QTS Event Service

Spring Boot service for the QTS durable event pipeline.

This service is intentionally compatible with the existing event tables:

- `outbox_events`
- `inbox_events`
- `inbox_dead_letters`

## What it does

1. Reads due outbox heads with transactional locking.
2. Publishes CloudEvents envelopes to Redis Streams.
3. Consumes `notification.requested.v1` with the `notification` consumer group.
4. Sends notifications through SMTP.
5. Records idempotent inbox state and durable dead letters.

## Safe migration posture

`QTS_EVENT_POLL_ENABLED=false` by default. Start the service for health/build checks
without taking over the event pipeline. During cutover, ensure no other event
publisher owns the same outbox stream, then enable:

```bash
QTS_EVENT_POLL_ENABLED=true
QTS_EVENT_MAIL_ENABLED=true
```

Mail delivery is disabled by default. Configure SMTP credentials from the
production secret store before enabling `QTS_EVENT_MAIL_ENABLED`.

Rollback is immediate: disable polling or restore the previous known-good
Spring image/config.
