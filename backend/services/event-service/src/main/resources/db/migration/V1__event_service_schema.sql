create table if not exists outbox_events (
    id uuid primary key,
    tenant_id uuid not null,
    event_type text not null,
    aggregate_type text not null,
    aggregate_id uuid not null,
    payload jsonb not null,
    headers jsonb not null,
    occurred_at timestamptz not null,
    published_at timestamptz null,
    attempt_count integer not null default 0,
    available_at timestamptz not null,
    created_at timestamptz not null
);

create index if not exists idx_outbox_pub_occ
    on outbox_events (published_at, occurred_at);

create index if not exists idx_outbox_agg_id
    on outbox_events (aggregate_type, aggregate_id);

create table if not exists inbox_events (
    id uuid primary key,
    consumer_name text not null,
    event_id uuid not null,
    idempotency_key text not null,
    status varchar(16) not null,
    processed_at timestamptz null,
    first_failed_at timestamptz null,
    request_id uuid null,
    attempt_count integer not null default 0,
    updated_at timestamptz not null,
    constraint uq_inbox_consumer_event unique (consumer_name, event_id),
    constraint uq_inbox_consumer_idempotency unique (consumer_name, idempotency_key)
);

create table if not exists inbox_dead_letters (
    id uuid primary key,
    consumer_name text not null,
    stream text not null,
    event_id uuid not null,
    event_type text not null,
    payload jsonb not null,
    error_class text not null,
    error_text text not null,
    attempt_count integer not null,
    first_failed_at timestamptz not null,
    moved_at timestamptz not null,
    dlq_published_at timestamptz null,
    replayed_at timestamptz null,
    constraint uq_inbox_dead_consumer_event unique (consumer_name, event_id)
);
