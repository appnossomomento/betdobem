create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  day text not null,
  token text not null,
  status text not null,
  sent_at timestamptz not null default now(),
  unique (kind, day, token)
);

revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.push_deliveries from anon, authenticated;
grant select on table public.push_subscriptions to authenticated;

alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_own on public.push_subscriptions;
create policy push_subscriptions_own on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());
