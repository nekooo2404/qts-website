create schema if not exists hrm;

create table if not exists hrm.companies (
    id uuid primary key,
    tenant_id uuid not null,
    code varchar(32) not null,
    name varchar(160) not null,
    status varchar(32) not null default 'active',
    version bigint not null default 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_companies__tenant_code unique (tenant_id, code)
);

create table if not exists hrm.branches (
    id uuid primary key,
    tenant_id uuid not null,
    company_id uuid not null references hrm.companies(id),
    code varchar(32) not null,
    name varchar(160) not null,
    status varchar(32) not null default 'active',
    version bigint not null default 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_branches__tenant_code unique (tenant_id, code)
);

create table if not exists hrm.departments (
    id uuid primary key,
    tenant_id uuid not null,
    company_id uuid not null references hrm.companies(id),
    branch_id uuid references hrm.branches(id),
    parent_id uuid references hrm.departments(id),
    code varchar(32) not null,
    name varchar(160) not null,
    status varchar(32) not null default 'active',
    version bigint not null default 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_departments__tenant_code unique (tenant_id, code),
    constraint ck_hrm_departments__not_self_parent check (parent_id is null or parent_id <> id)
);

create table if not exists hrm.positions (
    id uuid primary key,
    tenant_id uuid not null,
    department_id uuid references hrm.departments(id),
    reports_to_id uuid references hrm.positions(id),
    code varchar(32) not null,
    title varchar(160) not null,
    status varchar(32) not null default 'active',
    version bigint not null default 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_positions__tenant_code unique (tenant_id, code),
    constraint ck_hrm_positions__not_self_reports_to check (reports_to_id is null or reports_to_id <> id)
);

create table if not exists hrm.employees (
    id uuid primary key,
    tenant_id uuid not null,
    employee_code varchar(32) not null,
    legal_name varchar(160) not null,
    work_email varchar(254),
    department_id uuid references hrm.departments(id),
    position_id uuid references hrm.positions(id),
    manager_employee_id uuid references hrm.employees(id),
    employment_type varchar(32),
    employment_status varchar(32) not null default 'active',
    joining_date date,
    resignation_date date,
    active boolean not null default true,
    version bigint not null default 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_employees__tenant_code unique (tenant_id, employee_code),
    constraint ck_hrm_employees__not_self_manager check (manager_employee_id is null or manager_employee_id <> id)
);

create table if not exists hrm.employee_identity_links (
    id uuid primary key,
    tenant_id uuid not null,
    employee_id uuid not null references hrm.employees(id),
    identity_subject uuid not null,
    status varchar(32) not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_hrm_identity_links__tenant_subject unique (tenant_id, identity_subject),
    constraint uq_hrm_identity_links__tenant_employee unique (tenant_id, employee_id)
);

create table if not exists hrm.employee_personal_details (
    employee_id uuid primary key references hrm.employees(id),
    id_document_type varchar(32),
    id_number_encrypted text,
    id_number_hash varchar(128),
    birthday date,
    gender varchar(16),
    private_email_encrypted text,
    private_phone_encrypted text,
    permanent_address_encrypted text,
    tax_code_encrypted text,
    social_insurance_no_encrypted text,
    updated_by uuid,
    updated_at timestamptz not null default now()
);

create table if not exists hrm.employment_records (
    id uuid primary key,
    tenant_id uuid not null,
    employee_id uuid not null references hrm.employees(id),
    department_id uuid references hrm.departments(id),
    position_id uuid references hrm.positions(id),
    manager_employee_id uuid references hrm.employees(id),
    effective_from date not null,
    effective_to date,
    employment_status varchar(32) not null,
    decision_number varchar(64),
    note text,
    version bigint not null default 1,
    created_by uuid,
    created_at timestamptz not null default now(),
    constraint ck_hrm_employment_records__date_range check (effective_to is null or effective_to >= effective_from)
);

create table if not exists hrm.employee_dependents (
    id uuid primary key,
    tenant_id uuid not null,
    employee_id uuid not null references hrm.employees(id),
    full_name varchar(160) not null,
    relationship varchar(64) not null,
    date_of_birth date,
    id_number_encrypted text,
    tax_deductible boolean not null default false,
    status varchar(32) not null default 'active',
    created_by uuid,
    created_at timestamptz not null default now()
);

create table if not exists hrm.employee_emergency_contacts (
    id uuid primary key,
    tenant_id uuid not null,
    employee_id uuid not null references hrm.employees(id),
    full_name varchar(160) not null,
    relationship varchar(64) not null,
    phone_encrypted text,
    address_encrypted text,
    is_primary boolean not null default false,
    status varchar(32) not null default 'active',
    created_by uuid,
    created_at timestamptz not null default now()
);

create index if not exists idx_hrm_employees__tenant_status
    on hrm.employees (tenant_id, employment_status);
create index if not exists idx_hrm_employees__tenant_department
    on hrm.employees (tenant_id, department_id);
create index if not exists idx_hrm_employees__tenant_name
    on hrm.employees (tenant_id, legal_name);
create index if not exists idx_hrm_employment_records__employee_effective
    on hrm.employment_records (tenant_id, employee_id, effective_from desc);
create index if not exists idx_hrm_dependents__employee_status
    on hrm.employee_dependents (tenant_id, employee_id, status);
create index if not exists idx_hrm_emergency__employee_status
    on hrm.employee_emergency_contacts (tenant_id, employee_id, status);
