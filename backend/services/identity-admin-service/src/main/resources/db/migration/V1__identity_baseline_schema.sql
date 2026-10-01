create table if not exists identity_user (
    id uuid primary key,
    password varchar(128) not null default '',
    last_login timestamp null,
    is_superuser boolean not null default false,
    email varchar(254) not null unique,
    display_name varchar(160) not null,
    is_active boolean not null default true,
    is_staff boolean not null default false,
    ory_id uuid null unique,
    security_version integer not null default 1,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table if not exists identity_tenant (
    id uuid primary key,
    slug varchar(80) not null unique,
    name varchar(160) not null,
    status varchar(16) not null default 'active',
    require_mfa boolean not null default false,
    session_max_days integer not null default 7,
    created_at timestamp not null default current_timestamp
);

create table if not exists identity_organizationdomain (
    id bigserial primary key,
    tenant_id uuid not null references identity_tenant(id) on delete cascade,
    domain varchar(253) not null unique,
    verified_at timestamp null,
    created_at timestamp not null default current_timestamp
);

create table if not exists identity_permission (
    id bigserial primary key,
    code varchar(100) not null unique,
    name varchar(120) not null,
    description varchar(300) not null default '',
    created_at timestamp not null default current_timestamp
);

create table if not exists identity_role (
    id uuid primary key,
    tenant_id uuid null references identity_tenant(id) on delete cascade,
    code varchar(60) not null,
    name varchar(100) not null,
    description varchar(300) not null default '',
    is_system boolean not null default false,
    created_at timestamp not null default current_timestamp,
    constraint identity_role_code_per_tenant unique (tenant_id, code)
);

create table if not exists identity_membership (
    id uuid primary key,
    tenant_id uuid not null references identity_tenant(id) on delete cascade,
    user_id uuid not null references identity_user(id) on delete cascade,
    department varchar(120) not null default '',
    title varchar(120) not null default '',
    status varchar(16) not null default 'active',
    policy_version integer not null default 1,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint identity_membership_per_tenant unique (tenant_id, user_id)
);

create table if not exists identity_rolepermission (
    id bigserial primary key,
    role_id uuid not null references identity_role(id) on delete cascade,
    permission_id bigint not null references identity_permission(id) on delete cascade,
    constraint identity_role_permission_once unique (role_id, permission_id)
);

create table if not exists identity_membershiprole (
    id bigserial primary key,
    membership_id uuid not null references identity_membership(id) on delete cascade,
    role_id uuid not null references identity_role(id) on delete cascade,
    assigned_by_id uuid null references identity_user(id) on delete set null,
    created_at timestamp not null default current_timestamp,
    constraint identity_membership_role_once unique (membership_id, role_id)
);

create table if not exists identity_directgrant (
    id bigserial primary key,
    membership_id uuid not null references identity_membership(id) on delete cascade,
    permission_id bigint not null references identity_permission(id) on delete cascade,
    allowed boolean not null default true,
    assigned_by_id uuid null references identity_user(id) on delete set null,
    created_at timestamp not null default current_timestamp,
    constraint identity_direct_grant_once unique (membership_id, permission_id)
);

create table if not exists identity_application (
    id uuid primary key,
    tenant_id uuid null references identity_tenant(id) on delete cascade,
    client_id varchar(80) not null unique,
    name varchar(120) not null,
    slug varchar(80) not null,
    description varchar(300) not null default '',
    application_type varchar(20) not null default 'internal',
    redirect_uris jsonb not null default '[]'::jsonb,
    allowed_scopes jsonb not null default '[]'::jsonb,
    required_permissions jsonb not null default '[]'::jsonb,
    icon varchar(48) not null default 'squares-2x2',
    client_secret_hash varchar(128) not null default '',
    is_public boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint identity_application_slug_per_tenant unique (tenant_id, slug)
);

create table if not exists identity_applicationassignment (
    id bigserial primary key,
    membership_id uuid not null references identity_membership(id) on delete cascade,
    application_id uuid not null references identity_application(id) on delete cascade,
    is_enabled boolean not null default true,
    last_accessed_at timestamp null,
    created_at timestamp not null default current_timestamp,
    constraint identity_application_assignment_once unique (membership_id, application_id)
);

create table if not exists identity_identitysession (
    id uuid primary key,
    user_agent varchar(600) not null default '',
    ip_hash varchar(64) not null default '',
    location varchar(160) not null default '',
    authentication_methods jsonb not null default '[]'::jsonb,
    auth_time timestamp not null default current_timestamp,
    last_seen_at timestamp not null default current_timestamp,
    expires_at timestamp not null,
    revoked_at timestamp null,
    revoked_reason varchar(100) not null default '',
    user_id uuid not null references identity_user(id) on delete cascade,
    tenant_id uuid not null references identity_tenant(id) on delete cascade,
    security_version integer not null default 1,
    kratos_session_id uuid null,
    hydra_sid uuid null
);

create table if not exists identity_hrmemployeelink (
    id uuid primary key,
    tenant_id uuid not null references identity_tenant(id) on delete cascade,
    user_id uuid not null references identity_user(id) on delete cascade,
    membership_id uuid not null unique references identity_membership(id) on delete cascade,
    employee_id uuid not null,
    employee_code varchar(32) not null,
    status varchar(16) not null default 'active',
    source varchar(64) not null default 'manual',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint identity_hrm_link_user_once unique (tenant_id, user_id),
    constraint identity_hrm_employee_id_once unique (tenant_id, employee_id),
    constraint identity_hrm_employee_code_once unique (tenant_id, employee_code)
);

create table if not exists identity_auditevent (
    id uuid primary key,
    tenant_id uuid null references identity_tenant(id) on delete set null,
    actor_id uuid null references identity_user(id) on delete set null,
    action varchar(120) not null,
    target_type varchar(80) not null default '',
    target_id varchar(128) not null default '',
    outcome varchar(20) not null default 'success',
    ip_hash varchar(64) not null default '',
    user_agent varchar(600) not null default '',
    correlation_id uuid not null,
    metadata jsonb not null default '{}'::jsonb,
    previous_hash varchar(64) not null default '',
    event_hash varchar(64) not null unique,
    created_at timestamp not null default current_timestamp
);

create index if not exists identity_or_tenant__2c738b_idx on identity_organizationdomain(tenant_id, domain);
create index if not exists identity_me_tenant__56e1b4_idx on identity_membership(tenant_id, status);
create index if not exists identity_me_user_id_b450f4_idx on identity_membership(user_id, status);
create index if not exists identity_app_tenant_active_idx on identity_application(tenant_id, is_active);
create index if not exists identity_id_user_id_cd82a9_idx on identity_identitysession(user_id, tenant_id, revoked_at);
create index if not exists identity_id_expires_b5afc4_idx on identity_identitysession(expires_at);
create index if not exists identity_id_kratos_session_idx on identity_identitysession(kratos_session_id);
create index if not exists identity_id_hydra_sid_idx on identity_identitysession(hydra_sid);
create index if not exists identity_hr_tenant__323a68_idx on identity_hrmemployeelink(tenant_id, status);
create index if not exists identity_hr_members_1ad28e_idx on identity_hrmemployeelink(membership_id, status);
create index if not exists identity_au_tenant__9ca17c_idx on identity_auditevent(tenant_id, created_at);
create index if not exists identity_au_action_9f9acf_idx on identity_auditevent(action, created_at);
