-- ===========================================================================
--  Körfan — Supabase skema
--  Keyrðu þetta í Supabase Dashboard -> SQL Editor -> New query -> Run
-- ===========================================================================

-- Notendasnið (til að geta deilt með netfangi) -----------------------------
create table if not exists public.profiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  email  text unique
);

-- Afrita netfang sjálfkrafa þegar nýr notandi skráir sig
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Listar -------------------------------------------------------------------
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner       uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Meðlimir lista (fyrir deilingu) ------------------------------------------
create table if not exists public.list_members (
  list_id   uuid not null references public.lists(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member',
  primary key (list_id, user_id)
);

-- Vörur á lista ------------------------------------------------------------
create table if not exists public.list_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  name        text not null,
  dept        text not null default 'other',
  checked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists list_items_list_id_idx on public.list_items(list_id);

-- ===========================================================================
--  Row Level Security: notandi sér aðeins lista sem hann er meðlimur í
-- ===========================================================================
alter table public.profiles     enable row level security;
alter table public.lists        enable row level security;
alter table public.list_members enable row level security;
alter table public.list_items   enable row level security;

-- Hjálparfall: er notandinn meðlimur í þessum lista?
create or replace function public.is_member(p_list uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
  );
$$;

-- profiles: notandi sér aðeins sitt eigið snið
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid());

-- lists (eigandi sér alltaf sína lista — annars bregst INSERT ... RETURNING
--  á glænýjum lista sem á engan meðlim ennþá)
drop policy if exists lists_select on public.lists;
create policy lists_select on public.lists for select using (owner = auth.uid() or public.is_member(id));
drop policy if exists lists_insert on public.lists;
create policy lists_insert on public.lists for insert with check (owner = auth.uid());
drop policy if exists lists_update on public.lists;
create policy lists_update on public.lists for update using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists lists_delete on public.lists;
create policy lists_delete on public.lists for delete using (owner = auth.uid());

-- list_members
drop policy if exists members_select on public.list_members;
create policy members_select on public.list_members for select using (user_id = auth.uid() or public.is_member(list_id));
drop policy if exists members_insert on public.list_members;
create policy members_insert on public.list_members for insert with check (
  user_id = auth.uid() or exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid())
);
drop policy if exists members_delete on public.list_members;
create policy members_delete on public.list_members for delete using (
  exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid())
);

-- list_items (allir meðlimir mega lesa og breyta)
drop policy if exists items_all on public.list_items;
create policy items_all on public.list_items for all
  using (public.is_member(list_id))
  with check (public.is_member(list_id));

-- ===========================================================================
--  Deila lista með netfangi (öruggt fall — finnur notanda og bætir við)
-- ===========================================================================
create or replace function public.share_list(p_list uuid, p_email text)
returns boolean language plpgsql security definer as $$
declare target uuid;
begin
  -- aðeins eigandi listans má deila honum
  if not exists (select 1 from public.lists where id = p_list and owner = auth.uid()) then
    raise exception 'Aðeins eigandi má deila listanum';
  end if;
  select id into target from public.profiles where email = lower(p_email);
  if target is null then
    return false;  -- notandi með þetta netfang fannst ekki
  end if;
  insert into public.list_members (list_id, user_id, role)
    values (p_list, target, 'member')
    on conflict do nothing;
  return true;
end;
$$;

-- ===========================================================================
--  Rauntíma-samstilling
-- ===========================================================================
alter publication supabase_realtime add table public.list_items;
