create table if not exists attendance_devices (
    id uuid primary key,
    tenant_id uuid not null,
    device_code varchar(64) not null,
    kind varchar(16) not null,
    branch_id uuid null,
    public_key bytea not null,
    key_alg varchar(16) not null,
    status varchar(16) not null,
    version integer not null,
    revoked_at timestamptz null,
    revoke_reason varchar(32) not null,
    last_seen_at timestamptz null,
    last_sync_cursor uuid null,
    clock_anchor_server_time timestamptz null,
    created_at timestamptz not null,
    constraint uq_attendance_devices_tenant_code unique (tenant_id, device_code)
);

create table if not exists attendance_source_events (
    id uuid primary key,
    tenant_id uuid not null,
    device_id uuid not null,
    event_id uuid not null,
    employee_id uuid null,
    employee_ref varchar(128) not null,
    punch_type varchar(16) not null,
    occurred_at timestamptz not null,
    received_at timestamptz not null,
    nonce varchar(128) not null,
    signature bytea not null,
    payload jsonb not null,
    constraint uq_att_src_event unique (tenant_id, device_id, event_id),
    constraint uq_att_src_nonce unique (tenant_id, device_id, nonce)
);

create index if not exists idx_att_source_events_tenant_time
    on attendance_source_events (tenant_id, occurred_at);

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

create table if not exists idempotency_keys (
    id uuid primary key,
    tenant_id uuid not null,
    actor_id uuid not null,
    route text not null,
    "key" varchar(64) not null,
    request_hash varchar(64) not null,
    response_status integer null,
    response_body jsonb null,
    created_at timestamptz not null,
    constraint uq_idempotency_scope unique (tenant_id, actor_id, route, "key")
);
