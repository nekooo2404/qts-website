drop table if exists inbox_dead_letters;
drop table if exists inbox_events;
drop table if exists outbox_events;

create table outbox_events (
    id uuid primary key,
    tenant_id uuid not null,
    event_type varchar not null,
    aggregate_type varchar not null,
    aggregate_id uuid not null,
    payload clob not null,
    headers clob not null,
    occurred_at timestamp not null,
    published_at timestamp null,
    attempt_count integer not null default 0,
    available_at timestamp not null,
    created_at timestamp not null
);

create index idx_outbox_pub_occ on outbox_events (published_at, occurred_at);
create index idx_outbox_agg_id on outbox_events (aggregate_type, aggregate_id);

create table inbox_events (
    id uuid primary key,
    consumer_name varchar not null,
    event_id uuid not null,
    idempotency_key varchar not null,
    status varchar(16) not null,
    processed_at timestamp null,
    first_failed_at timestamp null,
    request_id uuid null,
    attempt_count integer not null default 0,
    updated_at timestamp not null,
    constraint uq_inbox_consumer_event unique (consumer_name, event_id),
    constraint uq_inbox_consumer_idempotency unique (consumer_name, idempotency_key)
);

create table inbox_dead_letters (
    id uuid primary key,
    consumer_name varchar not null,
    stream varchar not null,
    event_id uuid not null,
    event_type varchar not null,
    payload clob not null,
    error_class varchar not null,
    error_text clob not null,
    attempt_count integer not null,
    first_failed_at timestamp not null,
    moved_at timestamp not null,
    dlq_published_at timestamp null,
    replayed_at timestamp null,
    constraint uq_inbox_dead_consumer_event unique (consumer_name, event_id)
);
