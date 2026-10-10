create table if not exists public.school_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  version integer not null default 1,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_members (
  workspace_id uuid not null references public.school_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function public.create_school_workspace(workspace_name text, initial_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.school_workspaces;
begin
  if (select auth.uid()) is null or nullif(trim(workspace_name), '') is null then
    raise exception 'A signed-in user and workspace name are required';
  end if;

  insert into public.school_workspaces (name, created_by, payload)
  values (trim(workspace_name), (select auth.uid()), initial_payload)
  returning * into created;

  insert into public.school_members (workspace_id, user_id, role)
  values (created.id, (select auth.uid()), 'admin');

  return to_jsonb(created);
end;
$$;

revoke all on function public.create_school_workspace(text, jsonb) from public;
grant execute on function public.create_school_workspace(text, jsonb) to authenticated;

create or replace function public.prevent_workspace_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Workspace ownership cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_workspace_owner
  before update on public.school_workspaces
  for each row execute function public.prevent_workspace_owner_change();

alter table public.school_workspaces enable row level security;
alter table public.school_members enable row level security;

revoke all on public.school_workspaces, public.school_members from anon, authenticated;
grant select, update on public.school_workspaces to authenticated;
grant select on public.school_members to authenticated;

create policy "members can read their workspace membership"
  on public.school_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "members can read their workspace"
  on public.school_workspaces for select to authenticated
  using (
    exists (
      select 1 from public.school_members m
      where m.workspace_id = id and m.user_id = (select auth.uid())
    )
  );

create policy "workspace editors can update shared data"
  on public.school_workspaces for update to authenticated
  using (
    exists (
      select 1 from public.school_members m
      where m.workspace_id = id
        and m.user_id = (select auth.uid())
        and m.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.school_members m
      where m.workspace_id = id
        and m.user_id = (select auth.uid())
        and m.role in ('admin', 'editor')
    )
    and updated_by = (select auth.uid())
  );

create or replace function public.invite_school_member(member_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  target_workspace_id uuid;
begin
  select m.workspace_id into target_workspace_id
  from public.school_members m
  where m.user_id = (select auth.uid()) and m.role = 'admin'
  limit 1;

  if target_workspace_id is null then
    raise exception 'Only a workspace admin can invite members';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(member_email)
  limit 1;

  if target_user_id is null then
    raise exception 'Create an EduFlow account with this email before inviting it';
  end if;

  insert into public.school_members (workspace_id, user_id, role)
  values (target_workspace_id, target_user_id, 'editor')
  on conflict (workspace_id, user_id) do update set role = excluded.role;
end;
$$;

revoke all on function public.invite_school_member(text) from public;
grant execute on function public.invite_school_member(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'school_workspaces'
  ) then
    alter publication supabase_realtime add table public.school_workspaces;
  end if;
end;
$$;