/*
 * Compatibility backfill for HRM identity links.
 *
 * The Identity schema remains the source of truth for memberships and
 * Ory subjects while HRM owns its domain tables.  This migration is
 * intentionally additive and idempotent:
 * - fresh HRM-only databases simply skip it;
 * - databases with existing Identity tables receive a safe read projection;
 * - no Identity source table is modified and no HRM row is deleted.
 */

do $migration$
begin
    if to_regclass('public.identity_tenant') is null
       or to_regclass('public.identity_user') is null
       or to_regclass('public.identity_membership') is null
       or to_regclass('public.identity_hrmemployeelink') is null
       or not exists (
           select 1
             from information_schema.columns
            where table_schema = 'public'
              and table_name = 'identity_user'
              and column_name = 'ory_id'
       ) then
        return;
    end if;

    insert into hrm.companies (
        id, tenant_id, code, name, status, created_at, updated_at
    )
    select
        t.id,
        t.id,
        left(coalesce(nullif(regexp_replace(upper(t.slug), '[^A-Z0-9_-]', '', 'g'), ''), 'TENANT'), 32),
        t.name,
        case when t.status = 'active' then 'active' else 'inactive' end,
        coalesce(t.created_at, now()),
        coalesce(t.created_at, now())
    from public.identity_tenant t
    on conflict (id) do update
        set name = excluded.name,
            status = excluded.status,
            updated_at = now();

    insert into hrm.departments (
        id, tenant_id, company_id, code, name, status, created_at, updated_at
    )
    select
        md5(t.id::text || ':department:' || lower(trim(m.department)))::uuid,
        t.id,
        t.id,
        left('DEPT-' || md5(t.id::text || ':department:' || lower(trim(m.department))), 32),
        left(trim(m.department), 160),
        'active',
        now(),
        now()
    from public.identity_membership m
    join public.identity_tenant t on t.id = m.tenant_id
    where trim(coalesce(m.department, '')) <> ''
    group by t.id, m.department
    on conflict (id) do update
        set name = excluded.name,
            status = excluded.status,
            updated_at = now();

    insert into hrm.positions (
        id, tenant_id, department_id, code, title, status, created_at, updated_at
    )
    select
        md5(t.id::text || ':position:' || lower(trim(m.title)))::uuid,
        t.id,
        case
            when trim(coalesce(m.department, '')) = '' then null
            else md5(t.id::text || ':department:' || lower(trim(m.department)))::uuid
        end,
        left('POS-' || md5(t.id::text || ':position:' || lower(trim(m.title))), 32),
        left(trim(m.title), 160),
        'active',
        now(),
        now()
    from public.identity_membership m
    join public.identity_tenant t on t.id = m.tenant_id
    where trim(coalesce(m.title, '')) <> ''
    group by t.id, m.department, m.title
    on conflict (id) do update
        set title = excluded.title,
            department_id = excluded.department_id,
            status = excluded.status,
            updated_at = now();

    insert into hrm.employees (
        id, tenant_id, employee_code, legal_name, work_email,
        department_id, position_id, employment_status, active,
        created_at, updated_at
    )
    select
        l.employee_id,
        l.tenant_id,
        l.employee_code,
        left(coalesce(nullif(trim(u.display_name), ''), u.email), 160),
        lower(trim(u.email)),
        case
            when trim(coalesce(m.department, '')) = '' then null
            else md5(l.tenant_id::text || ':department:' || lower(trim(m.department)))::uuid
        end,
        case
            when trim(coalesce(m.title, '')) = '' then null
            else md5(l.tenant_id::text || ':position:' || lower(trim(m.title)))::uuid
        end,
        case when l.status = 'active' and u.is_active then 'active' else 'suspended' end,
        l.status = 'active' and u.is_active,
        coalesce(l.created_at, now()),
        coalesce(l.updated_at, now())
    from public.identity_hrmemployeelink l
    join public.identity_user u on u.id = l.user_id
    join public.identity_membership m on m.id = l.membership_id
    on conflict (id) do update
        set employee_code = excluded.employee_code,
            legal_name = excluded.legal_name,
            work_email = excluded.work_email,
            department_id = excluded.department_id,
            position_id = excluded.position_id,
            employment_status = excluded.employment_status,
            active = excluded.active,
            updated_at = now();

    insert into hrm.employee_identity_links (
        id, tenant_id, employee_id, identity_subject, status, created_at, updated_at
    )
    select
        l.id,
        l.tenant_id,
        l.employee_id,
        u.ory_id,
        case when l.status = 'active' and u.is_active then 'active' else 'disabled' end,
        coalesce(l.created_at, now()),
        coalesce(l.updated_at, now())
    from public.identity_hrmemployeelink l
    join public.identity_user u on u.id = l.user_id
    where u.ory_id is not null
    on conflict (id) do update
        set identity_subject = excluded.identity_subject,
            status = excluded.status,
            updated_at = now();
end
$migration$;
