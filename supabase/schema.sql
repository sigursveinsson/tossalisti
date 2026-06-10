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
  type        text not null default 'shopping',
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
  assignee    uuid references auth.users(id) on delete set null,
  points      int not null default 10,
  recurrence  text not null default 'none',
  due_at      date,
  weekday     text,
  completed_by uuid references auth.users(id) on delete set null,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- Afreka-skrá (stigatafla + endurtekin verk)
create table if not exists public.completions (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.lists(id) on delete cascade,
  item_id      uuid,
  user_id      uuid not null references auth.users(id) on delete cascade,
  points       int not null default 0,
  completed_at timestamptz not null default now()
);
create index if not exists completions_list_idx on public.completions(list_id);
alter table public.completions enable row level security;
drop policy if exists completions_select on public.completions;
create policy completions_select on public.completions for select using (public.is_member(list_id));
drop policy if exists completions_insert on public.completions;
create policy completions_insert on public.completions for insert with check (user_id = auth.uid() and public.is_member(list_id));
drop policy if exists completions_delete on public.completions;
create policy completions_delete on public.completions for delete using (user_id = auth.uid());

-- Meðlimir lista með netföngum (öruggt fall — aðeins meðlimir sjá)
create or replace function public.list_members_emails(p_list uuid)
returns table(user_id uuid, email text)
language sql security definer stable as $$
  select m.user_id, p.email
  from public.list_members m
  join public.profiles p on p.id = m.user_id
  where m.list_id = p_list and public.is_member(p_list);
$$;

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
--  Uppskriftir: notkun (mínar/vinsælar) og stjörnugjöf
-- ===========================================================================
create table if not exists public.recipe_uses (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,
  uses       int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.recipe_uses enable row level security;
drop policy if exists recipe_uses_own on public.recipe_uses;
create policy recipe_uses_own on public.recipe_uses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.recipe_ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,
  stars      int not null check (stars between 1 and 5),
  primary key (user_id, recipe_id)
);
alter table public.recipe_ratings enable row level security;
drop policy if exists ratings_own on public.recipe_ratings;
create policy ratings_own on public.recipe_ratings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.record_recipe_use(p_recipe text)
returns void language plpgsql security definer as $$
begin
  insert into public.recipe_uses (user_id, recipe_id, uses, updated_at)
  values (auth.uid(), p_recipe, 1, now())
  on conflict (user_id, recipe_id)
  do update set uses = public.recipe_uses.uses + 1, updated_at = now();
end; $$;

create or replace function public.popular_recipes()
returns table(recipe_id text, total bigint)
language sql security definer stable as $$
  select recipe_id, sum(uses)::bigint as total
  from public.recipe_uses group by recipe_id order by total desc;
$$;

create or replace function public.recipe_rating_stats()
returns table(recipe_id text, avg_stars numeric, num bigint)
language sql security definer stable as $$
  select recipe_id, round(avg(stars), 1) as avg_stars, count(*)::bigint as num
  from public.recipe_ratings group by recipe_id;
$$;

create or replace function public.rate_recipe(p_recipe text, p_stars int)
returns void language plpgsql security definer as $$
begin
  insert into public.recipe_ratings (user_id, recipe_id, stars)
  values (auth.uid(), p_recipe, p_stars)
  on conflict (user_id, recipe_id) do update set stars = excluded.stars;
end; $$;

-- ===========================================================================
--  Boðshlekkir (deila lista með hlekk)
-- ===========================================================================
create table if not exists public.list_invites (
  token       text primary key,
  list_id     uuid not null references public.lists(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz
);
alter table public.list_invites enable row level security;

create or replace function public.create_invite(p_list uuid)
returns text language plpgsql security definer as $$
declare t text;
begin
  if not public.is_member(p_list) then
    raise exception 'Aðeins meðlimir geta boðið í lista';
  end if;
  t := replace(gen_random_uuid()::text, '-', '');
  insert into public.list_invites (token, list_id, created_by, expires_at)
    values (t, p_list, auth.uid(), now() + interval '30 days');
  return t;
end; $$;

create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer as $$
declare inv public.list_invites;
begin
  select * into inv from public.list_invites where token = p_token;
  if inv.token is null then raise exception 'Boðshlekkur fannst ekki'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'Boðshlekkur er útrunninn';
  end if;
  insert into public.list_members (list_id, user_id, role)
    values (inv.list_id, auth.uid(), 'member')
    on conflict do nothing;
  return inv.list_id;
end; $$;

-- ===========================================================================
--  Krakka-prófílar (umsjár-meðlimir án innskráningar) — sjá migration
--  add_managed_kids_profiles. Foreldri "stofnar krakka": nafn + litur + mynd
--  (lítil data-URL í avatar_url). Verk má úthluta á krakka og afrek geta
--  tilheyrt krakka í stað innskráðs notanda.
-- ===========================================================================
create table if not exists public.kids (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists(id) on delete cascade,
  name       text not null,
  color      text,
  avatar_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists kids_list_idx on public.kids(list_id);
alter table public.kids enable row level security;
drop policy if exists kids_all on public.kids;
create policy kids_all on public.kids for all
  using (public.is_member(list_id)) with check (public.is_member(list_id));

alter table public.list_items add column if not exists assignee_kid uuid references public.kids(id) on delete set null;
alter table public.list_items add column if not exists completed_by_kid uuid references public.kids(id) on delete set null;
alter table public.completions add column if not exists kid_id uuid references public.kids(id) on delete cascade;
alter table public.completions alter column user_id drop not null;

drop policy if exists completions_insert on public.completions;
create policy completions_insert on public.completions for insert with check (
  public.is_member(list_id) and (
    user_id = auth.uid()
    or (user_id is null and exists (select 1 from public.kids k where k.id = kid_id and k.list_id = completions.list_id))
  )
);
drop policy if exists completions_delete on public.completions;
create policy completions_delete on public.completions for delete using (
  user_id = auth.uid() or (kid_id is not null and public.is_member(list_id))
);

-- ===========================================================================
--  Rauntíma-samstilling
-- ===========================================================================
alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.completions;
