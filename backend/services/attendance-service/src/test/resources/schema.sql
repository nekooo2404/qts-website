drop table if exists idempotency_keys;
drop table if exists attendance_source_events;
drop table if exists attendance_devices;
drop table if exists outbox_events;

create table attendance_devices (
    id uuid primary key,
    tenant_id uuid not null,
    device_code varchar(64) not null,
    kind varchar(16) not null,
    branch_id uuid null,
    public_key varbinary(64) not null,
    key_alg varchar(16) not null,
    status varchar(16) not null,
    version integer not null,
    revoked_at timestamp null,
    revoke_reason varchar(32) not null,
    last_seen_at timestamp null,
    last_sync_cursor uuid null,
    clock_anchor_server_time timestamp null,
    created_at timestamp not null,
    constraint uq_attendance_devices_tenant_code unique (tenant_id, device_code)
);

create table attendance_source_events (
    id uuid primary key,
    tenant_id uuid not null,
    device_id uuid not null,
    event_id uuid not null,
    employee_id uuid null,
    employee_ref varchar(128) not null,
    punch_type varchar(16) not null,
    occurred_at timestamp not null,
    received_at timestamp not null,
    nonce varchar(128) not null,
    signature varbinary(128) not null,
    payload clob not null,
    constraint uq_att_src_event unique (tenant_id, device_id, event_id),
    constraint uq_att_src_nonce unique (tenant_id, device_id, nonce)
);

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

create table idempotency_keys (
    id uuid primary key,
    tenant_id uuid not null,
    actor_id uuid not null,
    route varchar not null,
    "key" varchar(64) not null,
    request_hash varchar(64) not null,
    response_status integer null,
    response_body clob null,
    created_at timestamp not null,
    constraint uq_idempotency_scope unique (tenant_id, actor_id, route, "key")
);
