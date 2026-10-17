create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.admin_messages
  add column if not exists title text,
  add column if not exists message text;

update public.admin_messages
set
  title = coalesce(nullif(title, ''), 'Roundsquare update'),
  message = coalesce(nullif(message, ''), 'New information is available on the student dashboard.')
where title is null or message is null;

alter table public.admin_messages
  alter column title set not null,
  alter column message set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_messages_title_length'
      and conrelid = 'public.admin_messages'::regclass
  ) then
    alter table public.admin_messages
      add constraint admin_messages_title_length check (char_length(title) between 1 and 80);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_messages_message_length'
      and conrelid = 'public.admin_messages'::regclass
  ) then
    alter table public.admin_messages
      add constraint admin_messages_message_length check (char_length(message) between 1 and 500);
  end if;
end
$$;

alter table public.admin_messages enable row level security;

drop policy if exists "Anyone can read admin messages" on public.admin_messages;
create policy "Anyone can read admin messages"
  on public.admin_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create admin messages" on public.admin_messages;
create policy "Anyone can create admin messages"
  on public.admin_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can remove admin messages" on public.admin_messages;
create policy "Anyone can remove admin messages"
  on public.admin_messages for delete
  to anon, authenticated
  using (true);

alter table public.admin_messages replica identity full;
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_messages'
  ) then
    alter publication supabase_realtime add table public.admin_messages;
  end if;
end
$$;

create table if not exists public.global_celebration (
  event_key text primary key check (event_key = 'roundsquare-over'),
  activated_at timestamptz,
  stopped_at timestamptz
);

alter table public.global_celebration
  add column if not exists stopped_at timestamptz;

insert into public.global_celebration (event_key, activated_at)
values ('roundsquare-over', null)
on conflict (event_key) do nothing;

alter table public.global_celebration enable row level security;

drop policy if exists "Anyone can read global celebration" on public.global_celebration;
create policy "Anyone can read global celebration"
  on public.global_celebration for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can activate global celebration" on public.global_celebration;
drop policy if exists "Anyone can stop global celebration" on public.global_celebration;
drop policy if exists "Anyone can update global celebration" on public.global_celebration;

create policy "Anyone can update global celebration"
  on public.global_celebration for update
  to anon, authenticated
  using (true)
  with check (
    (activated_at is null and stopped_at is null)
    or activated_at is not null
  );

grant select, update on public.global_celebration to anon, authenticated;
alter table public.global_celebration replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'global_celebration'
  ) then
    alter publication supabase_realtime add table public.global_celebration;
  end if;
end
$$;
