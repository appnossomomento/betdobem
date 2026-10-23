-- BETdoBEM — schema inicial
-- Marco zero provisório: constante da app (186) até o fundador fechar o valor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  initials text not null check (char_length(initials) between 1 and 3),
  avatar_url text,
  shirt_size text,
  vip boolean not null default false,
  vip_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('stake', 'payout', 'reset', 'marco_zero', 'ajuste')),
  amount numeric(12, 2) not null,
  ref_type text,
  ref_id uuid,
  week_key text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_user_created_idx on public.ledger (user_id, created_at desc);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stake numeric(12, 2) not null check (stake >= 1),
  combined_odd numeric(12, 4) not null check (combined_odd > 1),
  potential_return numeric(12, 2) not null,
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'void')),
  placed_at timestamptz not null default now(),
  settled_at timestamptz,
  week_key text not null
);

create index if not exists bets_user_status_idx on public.bets (user_id, status);

create table if not exists public.bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets (id) on delete cascade,
  fixture_id text not null,
  market text not null default '1x2',
  selection_key text not null,
  phrase text not null,
  odd numeric(12, 4) not null check (odd > 1),
  result text check (result is null or result in ('won', 'lost', 'void', 'push'))
);

create index if not exists bet_legs_fixture_idx on public.bet_legs (fixture_id);

create table if not exists public.weeks (
  week_key text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reset_at timestamptz not null
);

create table if not exists public.week_capitals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_key text not null references public.weeks (week_key) on delete cascade,
  capital numeric(12, 2) not null default 0,
  primary key (user_id, week_key)
);

create table if not exists public.month_capitals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  month_key text not null,
  capital numeric(12, 2) not null default 0,
  primary key (user_id, month_key)
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  photo_url text,
  duration text not null check (duration in ('1 semana', '2 semanas', '1 mês')),
  player_cap int not null check (player_cap between 2 and 100),
  visibility text not null check (visibility in ('publica', 'privada')),
  outside_prize text,
  created_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active', 'ended'))
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index if not exists league_members_user_idx on public.league_members (user_id);

create table if not exists public.league_capital_events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  coins numeric(12, 2) not null,
  at timestamptz not null default now()
);

create index if not exists league_capital_events_league_idx
  on public.league_capital_events (league_id, at);

create table if not exists public.fixtures_cache (
  id text primary key,
  payload jsonb not null,
  saved_at timestamptz not null default now()
);

create or replace function public.balance_of(p_user uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0) from public.ledger where user_id = p_user;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Jogador');
  initials text;
begin
  initials := upper(left(regexp_replace(raw_name, '[^A-Za-zÀ-ÿ]', '', 'g') || 'XX', 2));
  insert into public.profiles (id, display_name, initials)
  values (new.id, raw_name, initials)
  on conflict (id) do nothing;
  insert into public.ledger (user_id, kind, amount, week_key)
  values (new.id, 'marco_zero', 186, to_char(timezone('America/Sao_Paulo', now()), '"W"IW-IYYY'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.ledger enable row level security;
alter table public.bets enable row level security;
alter table public.bet_legs enable row level security;
alter table public.weeks enable row level security;
alter table public.week_capitals enable row level security;
alter table public.month_capitals enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_capital_events enable row level security;
alter table public.fixtures_cache enable row level security;

-- Profiles
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Ledger: read own; writes only via service role
drop policy if exists ledger_select_own on public.ledger;
create policy ledger_select_own on public.ledger
  for select to authenticated using (user_id = auth.uid());

-- Bets
drop policy if exists bets_select_own on public.bets;
create policy bets_select_own on public.bets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists bet_legs_select_own on public.bet_legs;
create policy bet_legs_select_own on public.bet_legs
  for select to authenticated
  using (exists (select 1 from public.bets b where b.id = bet_id and b.user_id = auth.uid()));

-- Rankings
drop policy if exists weeks_select_all on public.weeks;
create policy weeks_select_all on public.weeks for select to authenticated using (true);

drop policy if exists week_capitals_select_all on public.week_capitals;
create policy week_capitals_select_all on public.week_capitals for select to authenticated using (true);

drop policy if exists month_capitals_select_all on public.month_capitals;
create policy month_capitals_select_all on public.month_capitals for select to authenticated using (true);

-- Leagues
drop policy if exists leagues_select_visible on public.leagues;
create policy leagues_select_visible on public.leagues
  for select to authenticated
  using (
    visibility = 'publica'
    or host_id = auth.uid()
    or exists (select 1 from public.league_members m where m.league_id = id and m.user_id = auth.uid())
  );

drop policy if exists league_members_select on public.league_members;
create policy league_members_select on public.league_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.leagues l
      where l.id = league_id
        and (l.host_id = auth.uid() or l.visibility = 'publica'
          or exists (select 1 from public.league_members m2 where m2.league_id = l.id and m2.user_id = auth.uid()))
    )
  );

drop policy if exists league_events_select on public.league_capital_events;
create policy league_events_select on public.league_capital_events
  for select to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = league_capital_events.league_id and m.user_id = auth.uid()
    )
    or exists (select 1 from public.leagues l where l.id = league_id and l.host_id = auth.uid())
  );

drop policy if exists fixtures_cache_select on public.fixtures_cache;
create policy fixtures_cache_select on public.fixtures_cache
  for select to authenticated using (true);

revoke all on public.ledger from anon, authenticated;
grant select on public.ledger to authenticated;
revoke all on public.bets from anon, authenticated;
grant select on public.bets to authenticated;
revoke all on public.bet_legs from anon, authenticated;
grant select on public.bet_legs to authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.weeks, public.week_capitals, public.month_capitals to authenticated;
grant select on public.leagues, public.league_members, public.league_capital_events, public.fixtures_cache to authenticated;
